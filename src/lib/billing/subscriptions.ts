import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Subscription lifecycle + grace/suspend logic (spec §6.4).
 *
 * A subscription has a period (endDate). After it lapses there is a grace window
 * before the tenant's site is suspended; paying again reactivates it. Payment
 * itself is manual (super-admin) or automated (platform gateway) — see
 * src/lib/payments.
 */
export const GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getActiveSubscription(tenantId: string) {
  return prisma.subscription.findFirst({
    where: {
      tenantId,
      status: { in: ["active", "trialing", "past_due"] },
    },
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true, price: true } } },
  });
}

/**
 * Records a paid period for a tenant and (re)activates the site. Cancels any
 * other open subscription first so there is a single active one.
 */
export async function activateSubscription(input: {
  tenantId: string;
  planId: string | null;
  paymentMethod: PaymentMethod;
  periodDays: number;
}): Promise<void> {
  const now = new Date();
  const endDate = new Date(now.getTime() + input.periodDays * DAY_MS);

  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: {
        tenantId: input.tenantId,
        status: { in: ["active", "trialing", "past_due"] },
      },
      data: { status: "cancelled" },
    });
    await tx.subscription.create({
      data: {
        tenantId: input.tenantId,
        planId: input.planId,
        paymentMethod: input.paymentMethod,
        status: "active",
        startDate: now,
        endDate,
      },
    });
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: { status: "active", planId: input.planId },
    });
  });
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "cancelled" },
  });
}

/**
 * Advances subscription/tenant state by time (spec §6.4). Intended to run on a
 * schedule (cron/BullMQ) or on demand from the admin:
 *  - active subscriptions past endDate but within grace -> past_due
 *  - subscriptions past endDate + grace -> expired, and the tenant is suspended
 */
export async function sweepSubscriptions(): Promise<{
  pastDue: number;
  suspended: number;
}> {
  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * DAY_MS);

  const pastDue = await prisma.subscription.updateMany({
    where: { status: "active", endDate: { lt: now, gte: graceCutoff } },
    data: { status: "past_due" },
  });

  const expired = await prisma.subscription.findMany({
    where: {
      status: { in: ["active", "past_due"] },
      endDate: { lt: graceCutoff },
    },
    select: { id: true, tenantId: true },
  });

  for (const sub of expired) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "expired" },
      }),
      prisma.tenant.update({
        where: { id: sub.tenantId },
        data: { status: "suspended" },
      }),
    ]);
  }

  return { pastDue: pastDue.count, suspended: expired.length };
}
