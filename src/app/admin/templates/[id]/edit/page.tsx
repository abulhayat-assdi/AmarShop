import { notFound } from "next/navigation";
import { SiteEditor } from "@/components/editor/SiteEditor";
import { requirePermission } from "@/lib/admin/permissions";
import { getTemplateById } from "@/lib/admin/templates";
import { blocksToPuckData } from "@/lib/editor/mapping";
import type { EditorBlock } from "@/lib/editor/mapping";
import { saveTemplateBlocksAction } from "../../actions";

/**
 * Visual editor for a master template (spec §5.5). Reuses the same Puck editor
 * tenants use for their own site — only the save target differs.
 */
export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("templates", "edit");
  const { id } = await params;
  const template = await getTemplateById(id);
  if (!template) notFound();

  async function save(blocks: EditorBlock[]) {
    "use server";
    await saveTemplateBlocksAction(id, blocks);
  }

  return (
    <SiteEditor
      initialData={blocksToPuckData(template.structureJson)}
      onSave={save}
      exitHref="/admin/templates"
      exitLabel="Exit to templates"
    />
  );
}
