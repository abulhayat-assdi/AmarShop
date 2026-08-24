import {
  PERMISSION_ACTIONS,
  type ResourcePermissions,
  RESOURCES,
} from "@/lib/admin/resources";

/**
 * Renders the checkbox grid of per-resource permissions (spec §6.7). Plain
 * markup (no hooks), so it works in both the client add-form and server
 * edit-forms. Checkbox names are `perm_<resource>_<action>` for the actions to
 * parse.
 */
export function PermissionGrid({
  current,
}: {
  current?: Record<string, ResourcePermissions>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-2 font-medium">Resource</th>
            {PERMISSION_ACTIONS.map((action) => (
              <th key={action} className="px-4 py-2 font-medium capitalize">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RESOURCES.map((resource) => (
            <tr
              key={resource.key}
              className="border-b border-black/5 last:border-0 dark:border-white/10"
            >
              <td className="px-4 py-2">{resource.label}</td>
              {PERMISSION_ACTIONS.map((action) => (
                <td key={action} className="px-4 py-2">
                  <input
                    type="checkbox"
                    name={`perm_${resource.key}_${action}`}
                    defaultChecked={current?.[resource.key]?.[action] ?? false}
                    className="h-4 w-4"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
