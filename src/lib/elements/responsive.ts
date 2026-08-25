import { z } from "zod";

/**
 * Responsive values (spec §5.7).
 *
 * Every style property can carry a per-breakpoint value, the way Elementor's
 * desktop/tablet/mobile switcher works. `base` is the desktop value and the
 * fallback; `tablet` and `mobile` override it below their max-width. Omitted
 * breakpoints simply inherit, so a value set once applies everywhere.
 */
export const BREAKPOINTS = ["base", "tablet", "mobile"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

/** Max-widths the emitted CSS uses for the two override breakpoints. */
export const BREAKPOINT_MAX_WIDTH: Record<
  Exclude<Breakpoint, "base">,
  number
> = {
  tablet: 1024,
  mobile: 767,
};

export type Responsive<T> = Partial<Record<Breakpoint, T>>;

/**
 * Wraps a value schema so it accepts either a bare value (treated as `base`) or
 * a per-breakpoint object. Authoring stays terse and older single-value data
 * keeps parsing.
 */
export function responsive<T extends z.ZodTypeAny>(schema: T) {
  const object = z
    .object({
      base: schema.optional(),
      tablet: schema.optional(),
      mobile: schema.optional(),
    })
    .partial();

  return z.preprocess(
    (value) =>
      value !== null &&
      typeof value === "object" &&
      BREAKPOINTS.some((bp) => bp in (value as object))
        ? value
        : value === undefined
          ? undefined
          : { base: value },
    object,
  );
}

/** The value in effect at a breakpoint, walking up to `base`. */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined,
  breakpoint: Breakpoint,
): T | undefined {
  if (!value) return undefined;
  if (breakpoint === "mobile") {
    return value.mobile ?? value.tablet ?? value.base;
  }
  if (breakpoint === "tablet") return value.tablet ?? value.base;
  return value.base;
}

/** True when a responsive value defines anything at all. */
export function hasResponsiveValue<T>(
  value: Responsive<T> | undefined,
): boolean {
  return Boolean(
    value &&
    (value.base !== undefined ||
      value.tablet !== undefined ||
      value.mobile !== undefined),
  );
}
