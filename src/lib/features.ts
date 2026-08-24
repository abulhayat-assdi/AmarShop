import { prisma } from "@/lib/prisma";

/**
 * Platform feature flags the super-admin can toggle per tenant (spec §6.5).
 *
 * Enforcement is via `hasFeature`; plan-based auto-assignment is refined in
 * Phase 2. The tenant's own payment gateway is governed by the dedicated
 * `tenants.ownGatewayApproved` flag (spec §6.2), so it is not a feature key here.
 */
export const FEATURE_KEYS = [
  "custom_domain",
  "advanced_analytics",
  "remove_branding",
  "multi_language",
  "product_reviews",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Returns every known feature key mapped to whether it is enabled for a tenant. */
export async function getTenantFeatures(
  tenantId: string,
): Promise<Record<FeatureKey, boolean>> {
  const rows = await prisma.tenantFeature.findMany({
    where: { tenantId },
    select: { featureKey: true, enabled: true },
  });
  const stored = new Map(rows.map((r) => [r.featureKey, r.enabled]));
  const result = {} as Record<FeatureKey, boolean>;
  for (const key of FEATURE_KEYS) {
    result[key] = stored.get(key) ?? false;
  }
  return result;
}

export async function setTenantFeature(
  tenantId: string,
  featureKey: FeatureKey,
  enabled: boolean,
): Promise<void> {
  await prisma.tenantFeature.upsert({
    where: { tenantId_featureKey: { tenantId, featureKey } },
    update: { enabled },
    create: { tenantId, featureKey, enabled },
  });
}

/** Backend feature check (spec §6.5). Frontend should not be the only gate. */
export async function hasFeature(
  tenantId: string,
  featureKey: FeatureKey,
): Promise<boolean> {
  const row = await prisma.tenantFeature.findUnique({
    where: { tenantId_featureKey: { tenantId, featureKey } },
    select: { enabled: true },
  });
  return row?.enabled ?? false;
}
