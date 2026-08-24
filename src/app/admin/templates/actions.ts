"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import { setTemplateActive, updateTemplateMeta } from "@/lib/admin/templates";

export async function toggleTemplateActiveAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("templateId") ?? "");
  if (!id) return;

  await setTemplateActive(id, formData.get("isActive") === "true");
  revalidatePath("/admin/templates");
}

const metaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
});

export async function updateTemplateMetaAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("templateId") ?? "");
  const parsed = metaSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });
  if (!id || !parsed.success) return;

  await updateTemplateMeta(id, parsed.data);
  revalidatePath("/admin/templates");
}
