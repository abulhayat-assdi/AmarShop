import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenant/context";
import { countTenantProducts } from "@/lib/tenant/db";

type TenantSiteParams = {
  params: Promise<{ subdomain: string; slug?: string[] }>;
};

/**
 * Public tenant site (spec §4.3, §5).
 *
 * Reached only through the subdomain rewrite in middleware. In Module 3 this is
 * a placeholder that confirms the request was routed to the right tenant and
 * scoped to its schema; the real storefront (TemplateRenderer) arrives in
 * Module 4.
 */
export default async function TenantSitePage({ params }: TenantSiteParams) {
  const { subdomain, slug } = await params;

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

  // Read from the tenant's own schema — proves the request is isolated to it.
  const productCount = await countTenantProducts(tenant.schemaName);
  const requestedPath = `/${slug?.join("/") ?? ""}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {tenant.siteType} site
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{tenant.name}</h1>
      </header>

      <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Routed by subdomain and scoped to this tenant&apos;s schema. The
          storefront rendering arrives in Module 4.
        </p>
        <dl className="grid grid-cols-[9rem_1fr] gap-y-3 text-sm">
          <dt className="text-zinc-500 dark:text-zinc-400">Subdomain</dt>
          <dd className="font-mono">{tenant.subdomain}</dd>
          <dt className="text-zinc-500 dark:text-zinc-400">Requested path</dt>
          <dd className="font-mono">{requestedPath}</dd>
          <dt className="text-zinc-500 dark:text-zinc-400">Products in schema</dt>
          <dd>{productCount}</dd>
        </dl>
      </section>
    </main>
  );
}
