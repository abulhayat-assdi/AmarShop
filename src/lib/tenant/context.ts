import { cache } from "react";
import { prisma } from "@/lib/prisma";

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
    select: {
      id: true,
      name: true,
      subdomain: true,
      schemaName: true,
      status: true,
      siteType: true,
    },
  });
});

export type ResolvedTenant = NonNullable<
  Awaited<ReturnType<typeof getTenantBySubdomain>>
>;
