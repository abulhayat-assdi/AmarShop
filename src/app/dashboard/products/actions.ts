"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/tenant/products";
import {
  productFormSchema,
  type ProductFormState,
} from "@/lib/validation/product";

/**
 * Creates or updates a product (create when `productId` is empty). Used with
 * useActionState so validation errors show inline; redirects on success.
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
  const input = {
    name: data.name,
    description: data.description?.length ? data.description : null,
    price: data.price,
    stock: data.stock,
    category: data.category?.length ? data.category : null,
    status: data.status,
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
  await deleteProduct(schema, id);
  revalidatePath("/dashboard/products");
}
