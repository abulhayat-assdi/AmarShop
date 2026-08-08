"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setSiteConfig } from "@/lib/tenant/site-config";

/**
 * Applies a master template to the signed-in owner's site (spec §5.6).
 *
 * The template's blocks are deep-copied into the tenant's own `site_config`, so
 * later edits never affect the master or other tenants. The target schema comes
 * from the session (server-validated), never from the request body — a user can
 * only write to their own tenant.
 */
export async function selectTemplate(formData: FormData) {
  const session = await auth();
  const schema = session?.user.tenantSchema;
  const tenantId = session?.user.tenantId;
  if (!session || !schema || !tenantId) redirect("/login");

  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;

  const template = await prisma.template.findFirst({
    where: { id: templateId, isActive: true },
    select: { id: true, structureJson: true },
  });
  if (!template) return;

  await setSiteConfig(schema, template.id, template.structureJson);
  revalidatePath("/dashboard");
}
