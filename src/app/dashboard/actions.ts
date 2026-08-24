"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { prisma } from "@/lib/prisma";
import { setSiteConfig } from "@/lib/tenant/site-config";

/**
 * Applies a master template to the current tenant's site (spec §5.6).
 *
 * The template's blocks are deep-copied into the tenant's own `site_config`, so
 * later edits never affect the master or other tenants. The target schema comes
 * from the resolved tenant context (owner or an impersonating super-admin),
 * never from the request body.
 */
export async function selectTemplate(formData: FormData) {
  const { schema } = await requireTenantContext();

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
