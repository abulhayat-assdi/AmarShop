"use server";

import { headers } from "next/headers";
import { type CartLine, placeOrder } from "@/lib/tenant/checkout";
import { getTenantBySubdomain } from "@/lib/tenant/context";
import { getRootDomain, getSubdomainFromHost } from "@/lib/tenant/subdomain";

/**
 * Places a storefront order (spec §6). The tenant is derived from the request
 * host (server-side), never from the client, so a customer cannot order into
 * another tenant's shop. Prices are recomputed from the database in placeOrder.
 */
export async function placeOrderAction(input: {
  customer: { name: string; phone: string; address: string; email: string };
  items: CartLine[];
}): Promise<{ orderId?: string; error?: string }> {
  const h = await headers();
  const subdomain =
    h.get("x-tenant-subdomain") ??
    getSubdomainFromHost(h.get("host"), getRootDomain());
  if (!subdomain) return { error: "Shop not found." };

  const tenant = await getTenantBySubdomain(subdomain);
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
    const { orderId } = await placeOrder(tenant.schemaName, {
      customerName: name,
      phone,
      address,
      email: input.customer.email?.trim() || null,
      items: input.items,
    });
    return { orderId };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Checkout failed.",
    };
  }
}
