import { z } from "zod";
import { type Block, parseBlocks } from "@/lib/blocks/schemas";

/**
 * Pure helpers for authoring templates in the super-admin (spec §5.5, §6.6):
 * slug normalisation plus the import/export contract shared with the
 * `templates/` folder files consumed by the seed script.
 *
 * No server imports here so the logic stays unit-testable and reusable from the
 * seed script and the admin actions alike.
 */

export const SITE_TYPES = [
  "ecommerce",
  "blog",
  "portfolio",
  "agency",
  "landing",
] as const;
export type TemplateSiteType = (typeof SITE_TYPES)[number];

/**
 * Turns arbitrary text into a URL-safe template slug: lowercase ASCII words
 * joined by single hyphens. Returns "" when nothing usable remains (e.g. a
 * purely Bangla name), so callers can fall back to an explicit slug.
 */
export function slugifyTemplateSlug(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Appends `-2`, `-3`, … until the slug no longer collides with `taken`, so
 * duplicating a template never fails on the unique constraint.
 */
export function uniqueTemplateSlug(
  base: string,
  taken: Iterable<string>,
): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("Could not derive a unique template slug.");
}

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers and single hyphens.",
  );

/** The on-disk / import-export shape of a template file. */
export const templateFileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  category: z.string().trim().min(1).max(100),
  siteType: z.enum(SITE_TYPES),
  previewUrl: z.string().trim().max(500).optional(),
  blocks: z.array(z.unknown()).default([]),
});

export type TemplateFile = z.infer<typeof templateFileSchema>;

export type TemplateImport = Omit<TemplateFile, "blocks"> & { blocks: Block[] };

/**
 * Validates a pasted/uploaded template JSON string. Blocks are run through
 * `parseBlocks`, so an import can never introduce unknown or malformed blocks —
 * the same gate the visual editor and the AI editor go through (spec §1.4).
 */
export function parseTemplateImport(
  raw: string,
): { ok: true; value: TemplateImport } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "The template JSON could not be parsed." };
  }

  const parsed = templateFileSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "The template JSON does not match the expected shape.",
    };
  }

  const blocks = parseBlocks(parsed.data.blocks);
  if (blocks.length === 0) {
    return {
      ok: false,
      error: "The template contains no valid blocks.",
    };
  }
  return { ok: true, value: { ...parsed.data, blocks } };
}

/** Serialises a template to the same JSON shape the `templates/` folder uses. */
export function serialiseTemplate(template: {
  name: string;
  slug: string;
  category: string;
  siteType: string;
  previewUrl?: string | null;
  structureJson: unknown;
}): string {
  const file: TemplateFile = {
    name: template.name,
    slug: template.slug,
    category: template.category,
    siteType: template.siteType as TemplateSiteType,
    ...(template.previewUrl ? { previewUrl: template.previewUrl } : {}),
    blocks: parseBlocks(template.structureJson),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** A minimal, valid starting point for a blank template. */
export function starterBlocks(siteType: TemplateSiteType): Block[] {
  const main: Block =
    siteType === "ecommerce"
      ? { type: "ProductGrid", data: { columns: 3, products: [] } }
      : siteType === "blog"
        ? { type: "BlogList", data: { posts: [] } }
        : siteType === "portfolio"
          ? { type: "Gallery", data: { images: [] } }
          : { type: "AboutSection", data: { heading: "About", body: "" } };

  return parseBlocks([
    { type: "Navbar", data: { logoText: "New site", links: [] } },
    {
      type: "HeroBanner",
      data: { heading: "Your headline here", buttonHref: "#" },
    },
    main,
    { type: "Footer", data: { text: "" } },
  ]);
}
