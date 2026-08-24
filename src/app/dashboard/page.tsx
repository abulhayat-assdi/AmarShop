import { redirect } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getOrderStats } from "@/lib/tenant/orders";
import { getProductStats } from "@/lib/tenant/products";
import { getSiteConfigBlocks } from "@/lib/tenant/site-config";
import { selectTemplate } from "./actions";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { tenantId, schema, subdomain, impersonating } =
    await requireTenantContext();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });
  if (!tenant) redirect(impersonating ? "/admin" : "/login");

  // Owners cannot use a suspended site; an impersonating admin may still inspect it.
  if (tenant.status === "suspended" && !impersonating) {
    return (
      <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-6">
        <h2 className="mb-1 text-lg font-medium">Site suspended</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {tenant.name} is currently suspended. Please contact support to
          restore access.
        </p>
      </section>
    );
  }

  const [productStats, orderStats, templates, currentBlocks] = await Promise.all(
    [
      getProductStats(schema),
      getOrderStats(schema),
      prisma.template.findMany({
        where: { isActive: true, siteType: tenant.siteType },
        select: { id: true, name: true, category: true },
        orderBy: { name: "asc" },
      }),
      getSiteConfigBlocks(schema),
    ],
  );
  const hasSite = Array.isArray(currentBlocks) && currentBlocks.length > 0;
  const siteUrl = `http://${subdomain}.${env.ROOT_DOMAIN}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Overview of your {tenant.siteType} site.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Products" value={productStats.total} />
        <StatCard label="Low stock (≤5)" value={productStats.lowStock} />
        <StatCard label="Orders" value={orderStats.total} />
        <StatCard
          label="Revenue"
          value={`৳${orderStats.revenue.toLocaleString("en-US")}`}
        />
      </div>

      <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
        <h2 className="mb-4 text-lg font-medium">Site</h2>
        <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
          <dt className="text-zinc-500 dark:text-zinc-400">Address</dt>
          <dd>
            <a href={siteUrl} className="underline">
              {subdomain}.{env.ROOT_DOMAIN}
            </a>
          </dd>
          <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
          <dd>{tenant.status}</dd>
          <dt className="text-zinc-500 dark:text-zinc-400">Plan</dt>
          <dd>{tenant.plan?.name ?? "—"}</dd>
          <dt className="text-zinc-500 dark:text-zinc-400">Storefront</dt>
          <dd>
            {hasSite ? (
              <a href={siteUrl} className="underline">
                Published · View site →
              </a>
            ) : (
              "No template applied yet"
            )}
          </dd>
        </dl>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-medium">
          {hasSite ? "Switch template" : "Choose a template"}
        </h2>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Applying a template replaces your layout with a fresh copy you can edit.
        </p>
        {templates.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No templates available for this site type yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
              >
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {template.category}
                  </p>
                </div>
                <form action={selectTemplate}>
                  <input type="hidden" name="templateId" value={template.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                  >
                    {hasSite ? "Switch" : "Use"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
