import { prisma } from "@/lib/prisma";

/** Platform-wide stats for the super-admin overview (spec §6.6). */
export async function getPlatformStats() {
  const [total, active, suspended, trial, activeTemplates, users, plans] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "active" } }),
      prisma.tenant.count({ where: { status: "suspended" } }),
      prisma.tenant.count({ where: { status: "trial" } }),
      prisma.template.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.plan.findMany({
        select: { name: true, _count: { select: { tenants: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    tenants: { total, active, suspended, trial },
    activeTemplates,
    users,
    plans: plans.map((p) => ({ name: p.name, tenants: p._count.tenants })),
  };
}
