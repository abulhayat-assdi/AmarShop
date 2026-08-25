import Link from "next/link";
import { NewTemplateForm } from "@/components/admin/NewTemplateForm";
import { requirePermission } from "@/lib/admin/permissions";
import { listAllTemplates } from "@/lib/admin/templates";

export default async function NewTemplatePage() {
  await requirePermission("templates", "edit");
  const templates = await listAllTemplates();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New template</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start blank, duplicate an existing template, or import a template
          JSON.{" "}
          <Link href="/admin/templates" className="underline">
            Back to templates
          </Link>
        </p>
      </div>

      <NewTemplateForm
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          siteType: t.siteType,
        }))}
      />
    </div>
  );
}
