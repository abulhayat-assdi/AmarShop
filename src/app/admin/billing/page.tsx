import Link from "next/link";
import { getBillingSummary, listTenantsBilling } from "@/lib/admin/billing";
import {
  getEffectivePermissions,
  requirePermission,
} from "@/lib/admin/permissions";
import { getPlatformGatewayInfo } from "@/lib/payments/resolver";
import { runSweepAction, setPlatformGatewayAction } from "./actions";

function formatPrice(n: number): string {
  return `৳${n.toLocaleString("en-US")}`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

const buttonClass =
  "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";
const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20";

export default async function BillingPage() {
  const session = await requirePermission("billing", "view");
  const [summary, tenants, perms, gatewayInfo] = await Promise.all([
    getBillingSummary(),
    listTenantsBilling(),
    getEffectivePermissions(session.user.id, session.user.role),
    getPlatformGatewayInfo(),
  ]);
  const canEdit = perms.billing.edit;
  const isSuperAdmin = session.user.role === "super_admin";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        {canEdit && (
          <form action={runSweepAction}>
            <button type="submit" className={buttonClass}>
              Run billing sweep
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Revenue (active)" value={formatPrice(summary.revenue)} />
        <StatCard label="Active subs" value={summary.activeSubscriptions} />
        <StatCard label="Past due" value={summary.pastDue} />
        <StatCard label="Active tenants" value={summary.activeTenants} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Tenants</h2>
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Tenant status</th>
                <th className="px-4 py-3 font-medium">Subscription</th>
                <th className="px-4 py-3 font-medium">Ends</th>
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
                  <td className="px-4 py-3">{tenant.plan?.name ?? "—"}</td>
                  <td className="px-4 py-3">{tenant.status}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {tenant.subscription
                      ? `${tenant.subscription.status} · ${tenant.subscription.paymentMethod}`
                      : "none"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {tenant.subscription?.endDate
                      ? tenant.subscription.endDate.toLocaleDateString()
                      : "—"}
                  </td>
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
      </section>

      {isSuperAdmin && (
        <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-lg font-medium">Platform payment gateway</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Shared gateway used by all tenants by default (spec §6.2). Credentials
            are encrypted at rest; requires ENCRYPTION_KEY to be set.
            {gatewayInfo
              ? ` Current: ${gatewayInfo.gateway} (${gatewayInfo.isActive ? "active" : "inactive"}).`
              : " Not configured yet."}
          </p>
          <form
            action={setPlatformGatewayAction}
            className="flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Gateway</span>
              <select name="gateway" defaultValue="bkash" className={fieldClass}>
                <option value="bkash" className="text-black">
                  bkash
                </option>
                <option value="sslcommerz" className="text-black">
                  sslcommerz
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Credentials (JSON)</span>
              <textarea
                name="credentials"
                rows={4}
                placeholder='{"appKey":"…","appSecret":"…"}'
                className={`${fieldClass} font-mono`}
              />
            </label>
            <button type="submit" className={`${buttonClass} self-start`}>
              Save gateway
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
