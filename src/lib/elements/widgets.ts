import { z } from "zod";
import { responsive } from "./responsive";

/**
 * Widget catalogue (spec §5.7).
 *
 * The Elementor-style element set: containers (Section/Column) plus the leaf
 * widgets a user drags onto the canvas. Each widget declares a zod schema for
 * its own content props — style lives separately in ./style — so every widget's
 * data is bounded and defaults are filled in automatically.
 *
 * `container: true` marks the element types that accept children.
 */

/** Only safe link targets; anything else becomes "#". */
const SAFE_HREF = /^(https?:\/\/|\/|#|mailto:|tel:)/i;
const href = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => (SAFE_HREF.test(value) ? value : "#"))
  .catch("#")
  .default("#");

const mediaUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || /^(https?:\/\/|\/)/i.test(value))
  .catch("")
  .default("");

/** Icons are a closed set — a name, never user-supplied SVG markup. */
export const ICON_NAMES = [
  "star",
  "heart",
  "check",
  "cart",
  "phone",
  "mail",
  "map-pin",
  "clock",
  "truck",
  "shield",
  "tag",
  "search",
  "user",
  "menu",
  "arrow-right",
  "facebook",
  "instagram",
  "whatsapp",
  "youtube",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

export const SHAPES = [
  "rectangle",
  "circle",
  "triangle",
  "diamond",
  "blob",
] as const;

const sectionProps = z
  .object({
    contentWidth: z.enum(["boxed", "full"]).catch("boxed").default("boxed"),
    /** Max content width in px when `boxed`. */
    boxedWidth: z.coerce.number().min(320).max(2400).catch(1152).default(1152),
    /** Stack columns below this breakpoint instead of sitting side by side. */
    stackOn: z.enum(["never", "tablet", "mobile"]).catch("mobile").default("mobile"),
    htmlTag: z.enum(["section", "header", "footer", "div", "main"])
      .catch("section")
      .default("section"),
  })
  .partial()
  .default({});

const columnProps = z.object({}).partial().default({});

const headingProps = z
  .object({
    text: z.string().max(5000).catch("").default("Heading"),
    level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]).catch("h2").default("h2"),
    href: href.optional(),
  })
  .partial()
  .default({});

const textProps = z
  .object({
    /** Plain text with newlines — never markup (spec §1.4). */
    text: z.string().max(20000).catch("").default(""),
  })
  .partial()
  .default({});

const imageProps = z
  .object({
    url: mediaUrl,
    alt: z.string().max(500).catch("").default(""),
    href: href.optional(),
    objectFit: z.enum(["cover", "contain", "fill"]).catch("cover").default("cover"),
    aspectRatio: z
      .enum(["auto", "1/1", "4/3", "3/2", "16/9", "3/4"])
      .catch("auto")
      .default("auto"),
  })
  .partial()
  .default({});

const buttonProps = z
  .object({
    text: z.string().max(200).catch("").default("Button"),
    href,
    newTab: z.boolean().catch(false).default(false),
    icon: z.enum(ICON_NAMES).optional(),
    iconPosition: z.enum(["left", "right"]).catch("left").default("left"),
    size: z.enum(["sm", "md", "lg"]).catch("md").default("md"),
  })
  .partial()
  .default({});

const dividerProps = z
  .object({
    thickness: z.coerce.number().min(1).max(40).catch(1).default(1),
    style: z.enum(["solid", "dashed", "dotted"]).catch("solid").default("solid"),
    widthPercent: z.coerce.number().min(5).max(100).catch(100).default(100),
  })
  .partial()
  .default({});

const spacerProps = z
  .object({
    height: responsive(z.coerce.number().min(0).max(800).catch(40)),
  })
  .partial()
  .default({});

const iconProps = z
  .object({
    name: z.enum(ICON_NAMES).catch("star").default("star"),
    size: responsive(z.coerce.number().min(8).max(400).catch(32)),
    href: href.optional(),
  })
  .partial()
  .default({});

const shapeProps = z
  .object({
    shape: z.enum(SHAPES).catch("rectangle").default("rectangle"),
    height: responsive(z.coerce.number().min(4).max(1200).catch(120)),
  })
  .partial()
  .default({});

const videoProps = z
  .object({
    /** YouTube/Vimeo page or embed URL, or a direct file URL. */
    url: mediaUrl,
    aspectRatio: z.enum(["16/9", "4/3", "1/1"]).catch("16/9").default("16/9"),
    controls: z.boolean().catch(true).default(true),
  })
  .partial()
  .default({});

/** Every element type, its props schema, and whether it accepts children. */
export const WIDGETS = {
  Section: { schema: sectionProps, container: true, label: "Section" },
  Column: { schema: columnProps, container: true, label: "Column" },
  Heading: { schema: headingProps, container: false, label: "Heading" },
  Text: { schema: textProps, container: false, label: "Text" },
  Image: { schema: imageProps, container: false, label: "Image" },
  Button: { schema: buttonProps, container: false, label: "Button" },
  Divider: { schema: dividerProps, container: false, label: "Divider" },
  Spacer: { schema: spacerProps, container: false, label: "Spacer" },
  Icon: { schema: iconProps, container: false, label: "Icon" },
  Shape: { schema: shapeProps, container: false, label: "Shape" },
  Video: { schema: videoProps, container: false, label: "Video" },
} as const;

export type WidgetType = keyof typeof WIDGETS;

export const WIDGET_TYPES = Object.keys(WIDGETS) as WidgetType[];

/** Types a user can drag from the palette (Column is created by Section). */
export const PALETTE_TYPES = WIDGET_TYPES.filter(
  (type) => type !== "Column",
) as WidgetType[];

export function isWidgetType(value: unknown): value is WidgetType {
  return typeof value === "string" && value in WIDGETS;
}

export function isContainer(type: WidgetType): boolean {
  return WIDGETS[type].container;
}

/** Parses a widget's props, filling defaults and dropping unsafe values. */
export function parseWidgetProps(
  type: WidgetType,
  raw: unknown,
): Record<string, unknown> {
  const parsed = WIDGETS[type].schema.safeParse(raw ?? {});
  return (parsed.success ? parsed.data : {}) as Record<string, unknown>;
}
