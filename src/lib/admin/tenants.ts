import type { TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dropTenantSchema } from "@/lib/tenant/provision";

/** Tenant management for the super-admin (spec §6.6). */

export async function listTenants() {
  return prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      status: true,
      siteType: true,
      ownGatewayApproved: true,
      createdAt: true,
      plan: { select: { name: true } },
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTenantDetail(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      schemaName: true,
      status: true,
      siteType: true,
      ownGatewayApproved: true,
      planId: true,
      createdAt: true,
      plan: { select: { id: true, name: true } },
      users: {
        select: { id: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function setTenantStatus(
  id: string,
  status: TenantStatus,
): Promise<void> {
  await prisma.tenant.update({ where: { id }, data: { status } });
}

export async function setTenantPlan(
  id: string,
  planId: string | null,
): Promise<void> {
  await prisma.tenant.update({ where: { id }, data: { planId } });
}

export async function setGatewayApproval(
  id: string,
  approved: boolean,
): Promise<void> {
  await prisma.tenant.update({
    where: { id },
    data: { ownGatewayApproved: approved },
  });
}

/**
 * Permanently deletes a tenant: its users, the tenant row (which cascades
 * feature flags), and its dedicated schema with all data. Destructive.
 */
export async function deleteTenant(id: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { schemaName: true },
  });
  if (!tenant) return;

  // users.tenant_id is ON DELETE SET NULL, so remove owner users explicitly.
  await prisma.user.deleteMany({ where: { tenantId: id } });
  await prisma.tenant.delete({ where: { id } });
  await dropTenantSchema(tenant.schemaName);
}
