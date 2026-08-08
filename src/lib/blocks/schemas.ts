import { z } from "zod";

/**
 * Block data contracts (spec §5).
 *
 * Every block is a `{ type, data }` pair. Each block type has a zod schema that
 * defines its editable data with safe defaults, so a template's/site's JSON is
 * always bounded and validated before it is rendered — users never supply raw
 * markup (spec §1.4, §5.7). These schemas are the single source of truth shared
 * by the renderer, the (future) editor, and the (future) AI editor.
 */

// Only safe link targets are allowed; anything else (e.g. a `javascript:` URL a
// user might inject via the editor) is coerced to "#". Keeps the JSON bounded.
const SAFE_HREF_PATTERN = /^(https?:\/\/|\/|#|mailto:|tel:)/i;
const hrefSchema = z
  .string()
  .default("#")
  .transform((value) => (SAFE_HREF_PATTERN.test(value) ? value : "#"));

const linkSchema = z.object({
  label: z.string().default("Link"),
  href: hrefSchema,
});

export const navbarSchema = z.object({
  logoText: z.string().default("Shop"),
  links: z.array(linkSchema).default([]),
});

export const heroBannerSchema = z.object({
  heading: z.string().default(""),
  subheading: z.string().optional(),
  buttonText: z.string().optional(),
  buttonHref: hrefSchema,
  bgColor: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const categoryBarSchema = z.object({
  categories: z.array(linkSchema).default([]),
});

const productSchema = z.object({
  name: z.string().default(""),
  price: z.number().nonnegative().default(0),
  imageUrl: z.string().optional(),
  badge: z.string().optional(),
});

export const productGridSchema = z.object({
  heading: z.string().optional(),
  columns: z
    .union([z.literal(2), z.literal(3), z.literal(4)])
    .default(3),
  products: z.array(productSchema).default([]),
});

export const gallerySchema = z.object({
  heading: z.string().optional(),
  images: z
    .array(z.object({ url: z.string(), alt: z.string().optional() }))
    .default([]),
});

export const aboutSectionSchema = z.object({
  heading: z.string().default("About"),
  body: z.string().default(""),
  imageUrl: z.string().optional(),
});

export const contactSectionSchema = z.object({
  heading: z.string().default("Contact"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const footerSchema = z.object({
  text: z.string().default(""),
  links: z.array(linkSchema).default([]),
});

const postSchema = z.object({
  title: z.string().default(""),
  excerpt: z.string().optional(),
  date: z.string().optional(),
  href: hrefSchema,
});

export const blogListSchema = z.object({
  heading: z.string().optional(),
  posts: z.array(postSchema).default([]),
});

// Data-shape types, derived from the schemas, for the block components' props.
export type NavbarData = z.infer<typeof navbarSchema>;
export type HeroBannerData = z.infer<typeof heroBannerSchema>;
export type CategoryBarData = z.infer<typeof categoryBarSchema>;
export type ProductGridData = z.infer<typeof productGridSchema>;
export type GalleryData = z.infer<typeof gallerySchema>;
export type AboutSectionData = z.infer<typeof aboutSectionSchema>;
export type ContactSectionData = z.infer<typeof contactSectionSchema>;
export type FooterData = z.infer<typeof footerSchema>;
export type BlogListData = z.infer<typeof blogListSchema>;

/**
 * A block: a discriminated union on `type`. Parsing an unknown value against
 * this yields a fully-typed, default-filled block (or is rejected).
 */
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Navbar"), data: navbarSchema }),
  z.object({ type: z.literal("HeroBanner"), data: heroBannerSchema }),
  z.object({ type: z.literal("CategoryBar"), data: categoryBarSchema }),
  z.object({ type: z.literal("ProductGrid"), data: productGridSchema }),
  z.object({ type: z.literal("Gallery"), data: gallerySchema }),
  z.object({ type: z.literal("AboutSection"), data: aboutSectionSchema }),
  z.object({ type: z.literal("ContactSection"), data: contactSectionSchema }),
  z.object({ type: z.literal("Footer"), data: footerSchema }),
  z.object({ type: z.literal("BlogList"), data: blogListSchema }),
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

/** All block type names, e.g. for an editor's "add block" palette. */
export const BLOCK_TYPES = blockSchema.options.map(
  (option) => option.shape.type.value,
) as BlockType[];

/**
 * Parses an unknown value (a template's/site's `blocks`) into a list of valid,
 * typed blocks. Invalid or unknown blocks are dropped rather than throwing, so
 * a single bad block never breaks the whole page.
 */
export function parseBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return [];
  const blocks: Block[] = [];
  for (const item of raw) {
    const parsed = blockSchema.safeParse(item);
    if (parsed.success) blocks.push(parsed.data);
  }
  return blocks;
}
