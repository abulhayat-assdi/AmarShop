import { headers } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const TENANT_SELECT = {
  id: true,
  name: true,
  subdomain: true,
  schemaName: true,
  status: true,
  siteType: true,
} as const;

/**
 * Server-side tenant resolution (Node runtime).
 *
 * `cache` dedupes the lookup within a single request, so the middleware-resolved
 * subdomain is turned into a tenant once per request. A cross-request cache
 * (Redis, spec §7.2) can wrap this later as a performance optimization.
 *
 * The tenant's `schemaName` is the ONLY source of the active schema for a public
 * site request — it is derived from the host, never from user input — which is
 * what keeps one tenant's request from ever reaching another tenant's data.
 */
export const getTenantBySubdomain = cache(async (subdomain: string) => {
  return prisma.tenant.findUnique({
    where: { subdomain },
    select: TENANT_SELECT,
  });
});

export const getTenantByCustomDomain = cache(async (host: string) => {
  return prisma.tenant.findUnique({
    where: { customDomain: host.toLowerCase() },
    select: TENANT_SELECT,
  });
});

export type ResolvedTenant = NonNullable<
  Awaited<ReturnType<typeof getTenantBySubdomain>>
>;

/**
 * Resolves the tenant for the current storefront request from the headers set by
 * middleware — `x-tenant-subdomain` for subdomain requests, or `x-tenant-host`
 * for custom-domain requests (spec §6.1). Returns null for a direct /s visit
 * (no middleware header), which the tenant routes turn into a 404.
 */
export async function resolveRequestTenant(): Promise<ResolvedTenant | null> {
  const h = await headers();
  const subdomain = h.get("x-tenant-subdomain");
  if (subdomain) return getTenantBySubdomain(subdomain);
  const host = h.get("x-tenant-host");
  if (host) return getTenantByCustomDomain(host);
  return null;
}
