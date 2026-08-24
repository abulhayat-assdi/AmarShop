import Link from "next/link";
import { requirePermission } from "@/lib/admin/permissions";
import { listTenants } from "@/lib/admin/tenants";

export default async function TenantsPage() {
  await requirePermission("tenants", "view");
  const tenants = await listTenants();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>

      {tenants.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No tenants yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Subdomain</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="px-4 py-3 font-medium">{tenant.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {tenant.subdomain}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {tenant.siteType}
                  </td>
                  <td className="px-4 py-3">{tenant.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3">{tenant.status}</td>
                  <td className="px-4 py-3">{tenant._count.users}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
