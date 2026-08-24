import { prisma } from "@/lib/prisma";

/**
 * Template management for the super-admin (spec §6.6). Phase 1 supports listing,
 * activo/deactivation, and basic metadata edits; the no-code builder UI for
 * adding templates is Phase 3 (spec §5.5).
 */
export async function listAllTemplates() {
  return prisma.template.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      siteType: true,
      isActive: true,
      updatedAt: true,
    },
    orderBy: [{ siteType: "asc" }, { name: "asc" }],
  });
}

export async function setTemplateActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await prisma.template.update({ where: { id }, data: { isActive } });
}

export async function updateTemplateMeta(
  id: string,
  data: { name: string; category: string },
): Promise<void> {
  await prisma.template.update({ where: { id }, data });
}
