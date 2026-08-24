import { notFound } from "next/navigation";
import { startImpersonationAction } from "@/app/admin/impersonation-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { getTenantDetail } from "@/lib/admin/tenants";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import { FEATURE_KEYS, getTenantFeatures } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import {
  deleteTenantAction,
  setFeatureAction,
  setGatewayAction,
  setPlanAction,
  setStatusAction,
} from "../actions";

const TENANT_STATUSES = ["active", "suspended", "trial"] as const;

const saveButtonClass =
  "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";
const selectClass =
  "rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const [tenant, features, plans] = await Promise.all([
    getTenantDetail(id),
    getTenantFeatures(id),
    prisma.plan.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!tenant) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenant.name}
          </h1>
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
            {tenant.subdomain} · {tenant.siteType}
          </p>
        </div>
        <form action={startImpersonationAction}>
          <input type="hidden" name="tenantId" value={tenant.id} />
          <button type="submit" className={saveButtonClass}>
            Impersonate
          </button>
        </form>
      </div>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 p-5 dark:border-white/15">
          <h2 className="mb-3 text-sm font-medium">Status</h2>
          <form action={setStatusAction} className="flex items-center gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <select
              name="status"
              defaultValue={tenant.status}
              className={selectClass}
            >
              {TENANT_STATUSES.map((status) => (
                <option key={status} value={status} className="text-black">
                  {status}
                </option>
              ))}
            </select>
            <button type="submit" className={saveButtonClass}>
              Save
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-black/10 p-5 dark:border-white/15">
          <h2 className="mb-3 text-sm font-medium">Plan</h2>
          <form action={setPlanAction} className="flex items-center gap-2">
            <input type="hidden" name="tenantId" value={tenant.id} />
            <select
              name="planId"
              defaultValue={tenant.planId ?? ""}
              className={selectClass}
            >
              <option value="" className="text-black">
                — none —
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id} className="text-black">
                  {plan.name}
                </option>
              ))}
            </select>
            <button type="submit" className={saveButtonClass}>
              Save
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 p-5 dark:border-white/15">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Own payment gateway</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {tenant.ownGatewayApproved
                ? "Approved — the tenant may connect its own gateway."
                : "Not approved — the tenant uses the platform gateway."}
            </p>
          </div>
          <form action={setGatewayAction}>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <input
              type="hidden"
              name="approved"
              value={tenant.ownGatewayApproved ? "false" : "true"}
            />
            <button type="submit" className={saveButtonClass}>
              {tenant.ownGatewayApproved ? "Revoke" : "Approve"}
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Feature flags</h2>
        <ul className="divide-y divide-black/5 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
          {FEATURE_KEYS.map((key) => (
            <li
              key={key}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="font-mono text-xs">{key}</span>
              <div className="flex items-center gap-3">
                <span
                  className={
                    features[key]
                      ? "text-green-600 dark:text-green-400"
                      : "text-zinc-400"
                  }
                >
                  {features[key] ? "on" : "off"}
                </span>
                <form action={setFeatureAction}>
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <input type="hidden" name="featureKey" value={key} />
                  <input
                    type="hidden"
                    name="enabled"
                    value={features[key] ? "false" : "true"}
                  />
                  <button type="submit" className={saveButtonClass}>
                    {features[key] ? "Disable" : "Enable"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Users</h2>
        <ul className="rounded-lg border border-black/10 text-sm dark:border-white/15">
          {tenant.users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between border-b border-black/5 px-4 py-3 last:border-0 dark:border-white/10"
            >
              <span>{user.email}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {user.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-red-500/40 bg-red-500/5 p-5">
        <h2 className="mb-1 text-sm font-medium text-red-700 dark:text-red-400">
          Delete tenant
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Permanently removes this tenant, its users, and its entire schema.
          This cannot be undone.
        </p>
        <form action={deleteTenantAction}>
          <input type="hidden" name="tenantId" value={tenant.id} />
          <ConfirmButton
            message={`Permanently delete "${tenant.name}" and all its data? This cannot be undone.`}
            className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-500/10 dark:text-red-400"
          >
            Delete permanently
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
