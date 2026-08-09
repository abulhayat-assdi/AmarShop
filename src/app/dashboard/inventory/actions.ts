"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { setProductStock } from "@/lib/tenant/products";

export async function setStockAction(formData: FormData) {
  const { schema } = await requireTenantContext();
  const id = String(formData.get("productId") ?? "");
  const stock = Number(formData.get("stock"));

  if (!id || !Number.isInteger(stock) || stock < 0) return;

  await setProductStock(schema, id, stock);
  revalidatePath("/dashboard/inventory");
}
