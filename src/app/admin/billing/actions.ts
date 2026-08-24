"use server";

import type { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/permissions";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import {
  activateSubscription,
  cancelSubscription,
  sweepSubscriptions,
} from "@/lib/billing/subscriptions";
import { setPlatformGateway } from "@/lib/payments/resolver";

const PAYMENT_METHODS = ["auto", "manual"] as const;

export async function activateSubscriptionAction(formData: FormData) {
  const session = await requirePermission("billing", "edit");
  const tenantId = String(formData.get("tenantId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const method = String(formData.get("paymentMethod") ?? "manual");
  const periodDays = Number(formData.get("periodDays"));
  if (!tenantId || !Number.isInteger(periodDays) || periodDays <= 0) return;

  const paymentMethod = (
    (PAYMENT_METHODS as readonly string[]).includes(method) ? method : "manual"
  ) as PaymentMethod;

  await activateSubscription({
    tenantId,
    planId: planId || null,
    paymentMethod,
    periodDays,
  });
  await logAudit({
    actorUserId: session.user.id,
    action: "subscription.activate",
    resource: "billing",
    targetId: tenantId,
    meta: { planId: planId || null, paymentMethod, periodDays },
  });
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/billing");
}

export async function cancelSubscriptionAction(formData: FormData) {
  const session = await requirePermission("billing", "edit");
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!subscriptionId) return;

  await cancelSubscription(subscriptionId);
  await logAudit({
    actorUserId: session.user.id,
    action: "subscription.cancel",
    resource: "billing",
    targetId: subscriptionId,
  });
  if (tenantId) revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/billing");
}

export async function runSweepAction() {
  const session = await requirePermission("billing", "edit");
  const result = await sweepSubscriptions();
  await logAudit({
    actorUserId: session.user.id,
    action: "billing.sweep",
    resource: "billing",
    meta: result,
  });
  revalidatePath("/admin/billing");
}

/** Platform gateway config is sensitive — super-admin only (spec §6.2). */
export async function setPlatformGatewayAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const gateway = String(formData.get("gateway") ?? "");
  const credentialsRaw = String(formData.get("credentials") ?? "");
  if (gateway !== "bkash" && gateway !== "sslcommerz") return;

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(credentialsRaw) as Record<string, string>;
  } catch {
    return;
  }

  await setPlatformGateway(gateway, credentials);
  await logAudit({
    actorUserId: session.user.id,
    action: "platform_gateway.configure",
    resource: "billing",
    meta: { gateway },
  });
  revalidatePath("/admin/billing");
}
