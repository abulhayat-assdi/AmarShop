import { listAuditLog } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/permissions";

export default async function AuditPage() {
  await requirePermission("audit", "view");
  const entries = await listAuditLog(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          The 100 most recent admin actions.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No audit entries yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {entry.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{entry.actorEmail}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {entry.action}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {entry.resource}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {entry.targetId ? entry.targetId.slice(0, 8) : "—"}
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
