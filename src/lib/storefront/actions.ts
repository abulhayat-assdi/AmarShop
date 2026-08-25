"use server";

import { formatTaka } from "@/lib/format";
import { notifySafe } from "@/lib/notifications";
import { type CartLine, placeOrder } from "@/lib/tenant/checkout";
import { resolveRequestTenant } from "@/lib/tenant/context";

/**
 * Places a storefront order (spec §6). The tenant is resolved from the request
 * host (via middleware headers), never from the client, so a customer cannot
 * order into another tenant's shop. Prices are recomputed from the database in
 * placeOrder.
 */
export async function placeOrderAction(input: {
  customer: { name: string; phone: string; address: string; email: string };
  items: CartLine[];
}): Promise<{ orderId?: string; error?: string }> {
  const tenant = await resolveRequestTenant();
  if (!tenant || tenant.status === "suspended") {
    return { error: "This shop is currently unavailable." };
  }

  const name = input.customer.name?.trim();
  const phone = input.customer.phone?.trim();
  const address = input.customer.address?.trim();
  if (!name || !phone || !address) {
    return { error: "Please provide your name, phone, and address." };
  }
  if (!input.items || input.items.length === 0) {
    return { error: "Your cart is empty." };
  }

  try {
    const { orderId, total } = await placeOrder(tenant.schemaName, {
      customerName: name,
      phone,
      address,
      email: input.customer.email?.trim() || null,
      items: input.items,
    });
    await notifySafe({
      channel: "sms",
      to: phone,
      subject: `${tenant.name} — order confirmed`,
      body: `Your order #${orderId.slice(0, 8)} is confirmed. Total ${formatTaka(total)}. Payment: Cash on Delivery.`,
    });
    return { orderId };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Checkout failed.",
    };
  }
}
