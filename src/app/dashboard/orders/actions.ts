"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import {
  ORDER_STATUSES,
  type OrderStatus,
  updateOrderStatus,
} from "@/lib/tenant/orders";

export async function updateOrderStatusAction(formData: FormData) {
  const { schema } = await requireTenantContext();
  const id = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !(ORDER_STATUSES as readonly string[]).includes(status)) return;

  await updateOrderStatus(schema, id, status as OrderStatus);
  revalidatePath("/dashboard/orders");
}
