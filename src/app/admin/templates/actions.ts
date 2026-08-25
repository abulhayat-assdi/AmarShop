"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/permissions";
import {
  parseTemplateImport,
  SITE_TYPES,
  slugifyTemplateSlug,
  starterBlocks,
  type TemplateSiteType,
} from "@/lib/admin/template-io";
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  setTemplateActive,
  updateTemplateBlocks,
  updateTemplateMeta,
} from "@/lib/admin/templates";
import { parseBlocks } from "@/lib/blocks/schemas";
import type { EditorBlock } from "@/lib/editor/mapping";

/** Return shape shared with the client forms' `useActionState`. */
export type TemplateFormState = { error?: string };

export async function toggleTemplateActiveAction(formData: FormData) {
  const session = await requirePermission("templates", "edit");
  const id = String(formData.get("templateId") ?? "");
  if (!id) return;

  const isActive = formData.get("isActive") === "true";
  await setTemplateActive(id, isActive);
  await logAudit({
    actorUserId: session.user.id,
    action: "template.active",
    resource: "templates",
    targetId: id,
    meta: { isActive },
  });
  revalidatePath("/admin/templates");
}

const metaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  siteType: z.enum(SITE_TYPES).optional(),
  previewUrl: z.string().trim().max(500).optional(),
});

export async function updateTemplateMetaAction(formData: FormData) {
  const session = await requirePermission("templates", "edit");
  const id = String(formData.get("templateId") ?? "");
  const siteTypeRaw = String(formData.get("siteType") ?? "");
  const parsed = metaSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    siteType: siteTypeRaw || undefined,
    previewUrl: formData.get("previewUrl") ?? undefined,
  });
  if (!id || !parsed.success) return;

  await updateTemplateMeta(id, {
    name: parsed.data.name,
    category: parsed.data.category,
    siteType: parsed.data.siteType,
    previewUrl: parsed.data.previewUrl || null,
  });
  await logAudit({
    actorUserId: session.user.id,
    action: "template.meta",
    resource: "templates",
    targetId: id,
    meta: parsed.data,
  });
  revalidatePath("/admin/templates");
}

/**
 * Saves the blocks edited in the visual editor. Re-validated server-side, so
 * the editor can never write raw or malformed content (spec §1.4).
 */
export async function saveTemplateBlocksAction(
  templateId: string,
  blocks: EditorBlock[],
) {
  const session = await requirePermission("templates", "edit");
  const count = await updateTemplateBlocks(templateId, blocks);
  await logAudit({
    actorUserId: session.user.id,
    action: "template.blocks",
    resource: "templates",
    targetId: templateId,
    meta: { blockCount: count },
  });
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}/edit`);
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(80).optional(),
  category: z.string().trim().min(1).max(100),
  siteType: z.enum(SITE_TYPES),
});

/**
 * Creates a template from one of three sources: a blank starter layout, a copy
 * of an existing template's blocks, or a pasted template JSON file.
 */
export async function createTemplateAction(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const session = await requirePermission("templates", "edit");
  const source = String(formData.get("source") ?? "blank");

  let created: { id: string; slug: string };

  if (source === "import") {
    const parsed = parseTemplateImport(String(formData.get("json") ?? ""));
    if (!parsed.ok) return { error: parsed.error };
    created = await createTemplate({ ...parsed.value, isActive: false });
  } else {
    const parsed = createSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug") ?? undefined,
      category: formData.get("category"),
      siteType: formData.get("siteType"),
    });
    if (!parsed.success) {
      return {
        error:
          parsed.error.issues[0]?.message ??
          "Please fill in the name, category and site type.",
      };
    }
    const { name, category, siteType } = parsed.data;

    let blocks = starterBlocks(siteType as TemplateSiteType);
    if (source === "duplicate") {
      const sourceId = String(formData.get("sourceTemplateId") ?? "");
      const original = sourceId ? await getTemplateById(sourceId) : null;
      if (!original) {
        return { error: "Pick an existing template to duplicate." };
      }
      blocks = parseBlocks(original.structureJson);
    }

    try {
      created = await createTemplate({
        name,
        slug: parsed.data.slug || slugifyTemplateSlug(name),
        category,
        siteType: siteType as TemplateSiteType,
        blocks,
        isActive: false,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Could not create template.",
      };
    }
  }

  await logAudit({
    actorUserId: session.user.id,
    action: "template.create",
    resource: "templates",
    targetId: created.id,
    meta: { slug: created.slug, source },
  });
  revalidatePath("/admin/templates");
  redirect(`/admin/templates/${created.id}/edit`);
}

/**
 * Deletes a template. Safe for existing sites: a tenant's site is a deep copy
 * made when the template was selected, so live sites are unaffected.
 */
export async function deleteTemplateAction(formData: FormData) {
  const session = await requirePermission("templates", "delete");
  const id = String(formData.get("templateId") ?? "");
  if (!id) return;

  const template = await getTemplateById(id);
  if (!template) return;

  await deleteTemplate(id);
  await logAudit({
    actorUserId: session.user.id,
    action: "template.delete",
    resource: "templates",
    targetId: id,
    meta: { slug: template.slug, name: template.name },
  });
  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}
