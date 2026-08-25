import { requirePermission } from "@/lib/admin/permissions";
import { serialiseTemplate } from "@/lib/admin/template-io";
import { getTemplateById } from "@/lib/admin/templates";

/**
 * Downloads a template as the same `template.json` shape the `templates/`
 * folder (and the seed script) uses, so a template authored in the panel can be
 * committed to the repo or imported on another install.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission("templates", "view");
  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(serialiseTemplate(template), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${template.slug}.json"`,
    },
  });
}
