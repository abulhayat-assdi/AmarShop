import { requireStaff } from "@/lib/admin/permissions";
import { getPlatformStats } from "@/lib/admin/stats";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireStaff();
  const stats = await getPlatformStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Platform-wide status.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tenants" value={stats.tenants.total} />
        <StatCard label="Active" value={stats.tenants.active} />
        <StatCard label="Trial" value={stats.tenants.trial} />
        <StatCard label="Suspended" value={stats.tenants.suspended} />
        <StatCard label="Templates" value={stats.activeTemplates} />
        <StatCard label="Users" value={stats.users} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Tenants by plan</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Tenants</th>
              </tr>
            </thead>
            <tbody>
              {stats.plans.map((plan) => (
                <tr
                  key={plan.name}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-4 py-3">{plan.tenants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
