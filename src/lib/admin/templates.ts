import type { Prisma, SiteType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Block } from "@/lib/blocks/schemas";
import { parseBlocks } from "@/lib/blocks/schemas";
import {
  slugifyTemplateSlug,
  type TemplateSiteType,
  uniqueTemplateSlug,
} from "./template-io";

/**
 * Template management for the super-admin (spec §5.5, §6.6): list, create
 * (blank / duplicate / JSON import), edit metadata and blocks, activate, and
 * delete. Blocks always pass through `parseBlocks` before they are stored, so a
 * template can only ever hold valid, bounded block data (spec §1.4).
 *
 * Templates are read-only blueprints: a tenant's site is a deep copy made at
 * selection time, so editing or deleting a template never changes a live site.
 */
export async function listAllTemplates() {
  const templates = await prisma.template.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      siteType: true,
      previewUrl: true,
      isActive: true,
      structureJson: true,
      updatedAt: true,
    },
    orderBy: [{ siteType: "asc" }, { name: "asc" }],
  });

  // The list only needs how many blocks a template has, not the blocks
  // themselves — keep the payload sent to the page small.
  return templates.map(({ structureJson, ...rest }) => ({
    ...rest,
    blockCount: parseBlocks(structureJson).length,
  }));
}

export async function getTemplateById(id: string) {
  return prisma.template.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      siteType: true,
      previewUrl: true,
      isActive: true,
      structureJson: true,
    },
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
  data: {
    name: string;
    category: string;
    siteType?: TemplateSiteType;
    previewUrl?: string | null;
  },
): Promise<void> {
  await prisma.template.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      ...(data.siteType ? { siteType: data.siteType as SiteType } : {}),
      ...(data.previewUrl !== undefined ? { previewUrl: data.previewUrl } : {}),
    },
  });
}

/** Replaces a template's blocks (from the visual editor or a JSON paste). */
export async function updateTemplateBlocks(
  id: string,
  blocks: unknown,
): Promise<number> {
  const valid = parseBlocks(blocks);
  await prisma.template.update({
    where: { id },
    data: { structureJson: valid as unknown as Prisma.InputJsonValue },
  });
  return valid.length;
}

/**
 * Creates a template, deriving a free slug from the requested one so
 * duplicating an existing template never collides.
 */
export async function createTemplate(input: {
  name: string;
  slug: string;
  category: string;
  siteType: TemplateSiteType;
  previewUrl?: string | null;
  blocks: Block[];
  isActive?: boolean;
}) {
  const base =
    slugifyTemplateSlug(input.slug) || slugifyTemplateSlug(input.name);
  if (!base) {
    throw new Error(
      "Could not derive a slug — please enter one using latin letters.",
    );
  }

  const existing = await prisma.template.findMany({ select: { slug: true } });
  const slug = uniqueTemplateSlug(
    base,
    existing.map((t) => t.slug),
  );

  return prisma.template.create({
    data: {
      name: input.name,
      slug,
      category: input.category,
      siteType: input.siteType as SiteType,
      previewUrl: input.previewUrl || null,
      structureJson: input.blocks as unknown as Prisma.InputJsonValue,
      isActive: input.isActive ?? true,
    },
    select: { id: true, slug: true },
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await prisma.template.delete({ where: { id } });
}
