"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { deleteTenantUpload, saveTenantImage } from "@/lib/storage/local";
import {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/lib/tenant/products";
import {
  productFormSchema,
  type ProductFormState,
} from "@/lib/validation/product";

/**
 * Creates or updates a product (create when `productId` is empty). Used with
 * useActionState so validation/upload errors show inline; redirects on success.
 */
export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { schema } = await requireTenantContext();

  const parsed = productFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    category: formData.get("category"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // Image: process a new upload if provided, otherwise keep the existing one.
  let images: string[] = [];
  const existing = String(formData.get("existingImage") ?? "");
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      const url = await saveTenantImage(schema, file);
      images = [url];
      if (existing) await deleteTenantUpload(existing);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Image upload failed",
      };
    }
  } else if (existing) {
    images = [existing];
  }

  const input = {
    name: data.name,
    description: data.description?.length ? data.description : null,
    price: data.price,
    stock: data.stock,
    category: data.category?.length ? data.category : null,
    status: data.status,
    images,
  };

  const productId = String(formData.get("productId") ?? "");
  if (productId) {
    await updateProduct(schema, productId, input);
  } else {
    await createProduct(schema, input);
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProductAction(formData: FormData) {
  const { schema } = await requireTenantContext();
  const id = String(formData.get("productId") ?? "");
  if (!id) return;

  // Clean up the product's stored image files, then the row.
  const product = await getProduct(schema, id);
  for (const url of product?.images ?? []) {
    await deleteTenantUpload(url);
  }
  await deleteProduct(schema, id);
  revalidatePath("/dashboard/products");
}
