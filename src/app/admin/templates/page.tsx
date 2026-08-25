import Link from "next/link";
import {
  getEffectivePermissions,
  requirePermission,
} from "@/lib/admin/permissions";
import { SITE_TYPES } from "@/lib/admin/template-io";
import { listAllTemplates } from "@/lib/admin/templates";
import {
  deleteTemplateAction,
  toggleTemplateActiveAction,
  updateTemplateMetaAction,
} from "./actions";

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20";
const buttonClass =
  "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

export default async function TemplatesAdminPage() {
  const session = await requirePermission("templates", "view");
  const [templates, perms] = await Promise.all([
    listAllTemplates(),
    getEffectivePermissions(session.user.id, session.user.role),
  ]);
  const canEdit = perms.templates.edit;
  const canDelete = perms.templates.delete;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {canEdit
              ? "Create, edit and manage the master templates tenants pick from. Templates are blueprints — editing one never changes a site that already copied it."
              : "View-only. Editing requires additional permissions."}
          </p>
        </div>
        {canEdit && (
          <Link
            href="/admin/templates/new"
            className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium"
          >
            New template
          </Link>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {templates.map((template) => (
          <li
            key={template.id}
            className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              {canEdit ? (
                <form
                  action={updateTemplateMetaAction}
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="templateId" value={template.id} />
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Name
                    </span>
                    <input
                      name="name"
                      defaultValue={template.name}
                      className={fieldClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Category
                    </span>
                    <input
                      name="category"
                      defaultValue={template.category}
                      className={fieldClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Site type
                    </span>
                    <select
                      name="siteType"
                      defaultValue={template.siteType}
                      className={fieldClass}
                    >
                      {SITE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Preview URL
                    </span>
                    <input
                      name="previewUrl"
                      defaultValue={template.previewUrl ?? ""}
                      placeholder="optional"
                      className={fieldClass}
                    />
                  </label>
                  <button type="submit" className={buttonClass}>
                    Save
                  </button>
                </form>
              ) : (
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {template.category} · {template.siteType} · {template.slug}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span
                  className={
                    template.isActive
                      ? "text-sm text-green-600 dark:text-green-400"
                      : "text-sm text-zinc-400"
                  }
                >
                  {template.isActive ? "active" : "inactive"}
                </span>
                {canEdit && (
                  <form action={toggleTemplateActiveAction}>
                    <input type="hidden" name="templateId" value={template.id} />
                    <input
                      type="hidden"
                      name="isActive"
                      value={template.isActive ? "false" : "true"}
                    />
                    <button type="submit" className={buttonClass}>
                      {template.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-black/5 pt-3 text-sm dark:border-white/10">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {template.slug} · {template.blockCount} block
                {template.blockCount === 1 ? "" : "s"}
              </span>
              {canEdit && (
                <Link
                  href={`/admin/templates/${template.id}/edit`}
                  className={buttonClass}
                >
                  Edit layout
                </Link>
              )}
              <a
                href={`/admin/templates/${template.id}/export`}
                className={buttonClass}
              >
                Export JSON
              </a>
              {canDelete && (
                <form action={deleteTemplateAction} className="ml-auto">
                  <input type="hidden" name="templateId" value={template.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      {templates.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No templates yet.
        </p>
      )}
    </div>
  );
}
