import { prisma } from "@/lib/prisma";

/** Billing overview data for the super-admin (spec §6.6). */
export async function listTenantsBilling() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      status: true,
      plan: { select: { name: true, price: true } },
      subscriptions: {
        where: { status: { in: ["active", "trialing", "past_due"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return tenants.map((t) => ({
    ...t,
    subscription: t.subscriptions[0] ?? null,
  }));
}

export async function getBillingSummary() {
  const [activeTenants, activeSubs, pastDue] = await Promise.all([
    prisma.tenant.findMany({
      where: { status: "active" },
      select: { plan: { select: { price: true } } },
    }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscription.count({ where: { status: "past_due" } }),
  ]);
  const revenue = activeTenants.reduce(
    (sum, t) => sum + (t.plan?.price ?? 0),
    0,
  );
  return {
    revenue,
    activeSubscriptions: activeSubs,
    pastDue,
    activeTenants: activeTenants.length,
  };
}
