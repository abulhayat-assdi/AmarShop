import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import { listAllTemplates } from "@/lib/admin/templates";
import {
  toggleTemplateActiveAction,
  updateTemplateMetaAction,
} from "./actions";

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20";
const buttonClass =
  "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

export default async function TemplatesAdminPage() {
  await requireSuperAdmin();
  const templates = await listAllTemplates();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Edit metadata and toggle availability. Adding templates via a no-code
          builder is Phase 3.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {templates.map((template) => (
          <li
            key={template.id}
            className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <form
              action={updateTemplateMetaAction}
              className="flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="templateId" value={template.id} />
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Name</span>
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
              <span className="pb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {template.siteType} · {template.slug}
              </span>
              <button type="submit" className={buttonClass}>
                Save
              </button>
            </form>

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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
