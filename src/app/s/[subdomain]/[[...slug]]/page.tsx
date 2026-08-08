import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/TemplateRenderer";
import { getTenantBySubdomain } from "@/lib/tenant/context";
import { getSiteConfigBlocks } from "@/lib/tenant/site-config";

type TenantSiteParams = {
  params: Promise<{ subdomain: string; slug?: string[] }>;
};

/**
 * Public tenant site (spec §4.3, §5.4).
 *
 * Reached only through the subdomain rewrite in middleware. Resolves the tenant
 * from the host, then renders its `site_config` blocks through the shared
 * TemplateRenderer — the same renderer draws every tenant's site.
 */
export default async function TenantSitePage({ params }: TenantSiteParams) {
  const { subdomain } = await params;

  // Only reachable via the subdomain rewrite (middleware sets this header);
  // a direct /s/<subdomain> visit on the platform domain 404s.
  const viaMiddleware = (await headers()).get("x-tenant-subdomain");
  if (viaMiddleware !== subdomain) notFound();

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  if (tenant.status === "suspended") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Site unavailable
        </h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          {tenant.name} is currently suspended.
        </p>
      </main>
    );
  }

  // The tenant's live site — scoped to its own schema (host-derived, isolated).
  const blocks = await getSiteConfigBlocks(tenant.schemaName);
  const hasSite = Array.isArray(blocks) && blocks.length > 0;

  if (!hasSite) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
        <p className="max-w-md text-zinc-500 dark:text-zinc-400">
          This site hasn&apos;t been set up yet. The owner can choose a template
          from their dashboard.
        </p>
      </main>
    );
  }

  return <TemplateRenderer blocks={blocks} />;
}
