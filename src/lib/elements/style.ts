import { z } from "zod";
import { responsive } from "./responsive";

/**
 * Bounded style tokens (spec §1.4, §5.7).
 *
 * Users style elements the way they would in Elementor — colours, spacing,
 * typography, borders, shadows — but never by writing CSS. Every property here
 * is a validated primitive from a closed set: an enum, or a number clamped to a
 * sane range, or a colour matching a strict pattern. Anything else is coerced to
 * a safe default via `.catch()`, so a hand-edited or AI-produced value can never
 * inject CSS (no `url(javascript:…)`, no `}` to escape the rule, no `expression`).
 *
 * The emitter in ./css turns these tokens into real declarations; because the
 * values are already primitives, that step needs no further escaping.
 */

/** #rgb, #rrggbb, #rrggbbaa, rgb()/rgba(), or a small set of keywords. */
const COLOR_PATTERN =
  /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)|transparent|currentColor|inherit)$/i;

export const colorToken = z
  .string()
  .trim()
  .refine((value) => COLOR_PATTERN.test(value))
  .catch(() => undefined as unknown as string)
  .optional();

/** Only http(s) and site-relative image URLs — never `javascript:` or `data:`. */
const IMAGE_URL_PATTERN = /^(https?:\/\/|\/)[^\s"'()<>\\]*$/i;

export const imageUrlToken = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => IMAGE_URL_PATTERN.test(value))
  .catch(() => undefined as unknown as string)
  .optional();

/** A number clamped to [min, max]; out-of-range or non-numeric becomes unset. */
function num(min: number, max: number) {
  return z.coerce
    .number()
    .min(min)
    .max(max)
    .catch(() => undefined as unknown as number)
    .optional();
}

function enumToken<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .enum(values)
    .catch(() => undefined as unknown as T[number])
    .optional();
}

export const FONT_FAMILIES = [
  "inherit",
  "sans",
  "serif",
  "mono",
  "bangla",
] as const;
export const TEXT_ALIGNS = ["left", "center", "right", "justify"] as const;
export const TEXT_TRANSFORMS = [
  "none",
  "uppercase",
  "lowercase",
  "capitalize",
] as const;
export const BORDER_STYLES = ["none", "solid", "dashed", "dotted"] as const;
export const SHADOW_PRESETS = ["none", "sm", "md", "lg", "xl"] as const;
export const BACKGROUND_SIZES = ["cover", "contain", "auto"] as const;
export const BACKGROUND_POSITIONS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
] as const;
export const FLEX_ALIGNMENTS = [
  "flex-start",
  "center",
  "flex-end",
  "stretch",
] as const;
export const FLEX_JUSTIFY = [
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
] as const;

/** Four-sided spacing in px. */
const sides = z
  .object({
    top: num(-200, 400),
    right: num(-200, 400),
    bottom: num(-200, 400),
    left: num(-200, 400),
  })
  .partial();

const corners = z
  .object({
    topLeft: num(0, 400),
    topRight: num(0, 400),
    bottomRight: num(0, 400),
    bottomLeft: num(0, 400),
  })
  .partial();

const borderWidth = z
  .object({
    top: num(0, 40),
    right: num(0, 40),
    bottom: num(0, 40),
    left: num(0, 40),
  })
  .partial();

/**
 * The style bag carried by every element. Each entry is responsive, so the same
 * property can differ on desktop, tablet and mobile.
 */
export const styleSchema = z
  .object({
    // Layout & sizing
    width: responsive(enumToken(["auto", "full", "fit"] as const)),
    widthPercent: responsive(num(1, 100)),
    maxWidth: responsive(num(0, 4000)),
    minHeight: responsive(num(0, 4000)),
    align: responsive(enumToken(TEXT_ALIGNS)),
    alignItems: responsive(enumToken(FLEX_ALIGNMENTS)),
    justifyContent: responsive(enumToken(FLEX_JUSTIFY)),
    gap: responsive(num(0, 200)),
    hidden: responsive(z.boolean().catch(false).optional()),

    // Spacing
    padding: responsive(sides),
    margin: responsive(sides),

    // Typography
    fontFamily: responsive(enumToken(FONT_FAMILIES)),
    fontSize: responsive(num(8, 200)),
    fontWeight: responsive(num(100, 900)),
    lineHeight: responsive(num(0.7, 4)),
    letterSpacing: responsive(num(-10, 40)),
    textTransform: responsive(enumToken(TEXT_TRANSFORMS)),
    color: responsive(colorToken),

    // Background
    backgroundColor: responsive(colorToken),
    backgroundImage: responsive(imageUrlToken),
    backgroundSize: responsive(enumToken(BACKGROUND_SIZES)),
    backgroundPosition: responsive(enumToken(BACKGROUND_POSITIONS)),

    // Border & effects
    borderStyle: responsive(enumToken(BORDER_STYLES)),
    borderWidth: responsive(borderWidth),
    borderColor: responsive(colorToken),
    borderRadius: responsive(corners),
    shadow: responsive(enumToken(SHADOW_PRESETS)),
    opacity: responsive(num(0, 1)),
  })
  .partial();

export type ElementStyle = z.infer<typeof styleSchema>;

/** Parses an unknown style bag, dropping anything that is not a safe token. */
export function parseStyle(raw: unknown): ElementStyle {
  const parsed = styleSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}
