import {
  BREAKPOINT_MAX_WIDTH,
  type Breakpoint,
  type Responsive,
  resolveResponsive,
} from "./responsive";
import type { ElementStyle } from "./style";

/**
 * Turns validated style tokens into CSS (spec §5.7).
 *
 * Responsive values cannot be expressed as inline styles, so each element gets
 * a generated class (`.el-<id>`) and the page carries one stylesheet built from
 * its tree. Values arriving here already passed ./style's validation — they are
 * numbers, enum members, or pattern-checked colours — so the declarations below
 * are safe to build by concatenation. Class names are derived from element ids,
 * which ./tree restricts to `[a-z0-9-]`.
 */
const FONT_STACKS: Record<string, string> = {
  inherit: "inherit",
  sans: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  // Bangla-first stack — the storefront's primary audience (spec §2).
  bangla: '"Noto Sans Bengali", "Hind Siliguri", ui-sans-serif, sans-serif',
};

const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 12px rgba(0,0,0,0.10)",
  lg: "0 10px 30px rgba(0,0,0,0.14)",
  xl: "0 20px 50px rgba(0,0,0,0.18)",
};

const WIDTHS: Record<string, string> = {
  auto: "auto",
  full: "100%",
  fit: "fit-content",
};

type Decls = string[];

function px(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `${value}px`;
}

function push(decls: Decls, property: string, value: string | undefined) {
  if (value !== undefined) decls.push(`${property}:${value}`);
}

function at<T>(
  value: Responsive<T> | undefined,
  breakpoint: Breakpoint,
): T | undefined {
  return resolveResponsive(value, breakpoint);
}

/**
 * The declarations for one breakpoint. `base` emits everything it has; the
 * override breakpoints emit only properties that actually differ, keeping the
 * media queries small.
 */
function declarationsFor(style: ElementStyle, breakpoint: Breakpoint): Decls {
  const decls: Decls = [];
  const only = <T>(key: keyof ElementStyle): T | undefined => {
    const value = at(style[key] as Responsive<T> | undefined, breakpoint);
    if (breakpoint === "base") return value;
    // Skip properties whose value is inherited rather than overridden.
    const parent = at(
      style[key] as Responsive<T> | undefined,
      breakpoint === "mobile" ? "tablet" : "base",
    );
    return value === parent ? undefined : value;
  };

  const hidden = only<boolean>("hidden");
  if (hidden !== undefined) push(decls, "display", hidden ? "none" : "revert");

  const width = only<string>("width");
  push(decls, "width", width ? WIDTHS[width] : undefined);
  const widthPercent = only<number>("widthPercent");
  if (widthPercent !== undefined) push(decls, "width", `${widthPercent}%`);
  push(decls, "max-width", px(only<number>("maxWidth")));
  push(decls, "min-height", px(only<number>("minHeight")));
  push(decls, "text-align", only<string>("align"));
  push(decls, "align-items", only<string>("alignItems"));
  push(decls, "justify-content", only<string>("justifyContent"));
  push(decls, "gap", px(only<number>("gap")));

  const padding = only<Record<string, number | undefined>>("padding");
  if (padding) {
    push(decls, "padding-top", px(padding.top));
    push(decls, "padding-right", px(padding.right));
    push(decls, "padding-bottom", px(padding.bottom));
    push(decls, "padding-left", px(padding.left));
  }
  const margin = only<Record<string, number | undefined>>("margin");
  if (margin) {
    push(decls, "margin-top", px(margin.top));
    push(decls, "margin-right", px(margin.right));
    push(decls, "margin-bottom", px(margin.bottom));
    push(decls, "margin-left", px(margin.left));
  }

  const family = only<string>("fontFamily");
  push(decls, "font-family", family ? FONT_STACKS[family] : undefined);
  push(decls, "font-size", px(only<number>("fontSize")));
  const weight = only<number>("fontWeight");
  push(decls, "font-weight", weight === undefined ? undefined : String(weight));
  const lineHeight = only<number>("lineHeight");
  push(
    decls,
    "line-height",
    lineHeight === undefined ? undefined : String(lineHeight),
  );
  push(decls, "letter-spacing", px(only<number>("letterSpacing")));
  push(decls, "text-transform", only<string>("textTransform"));
  push(decls, "font-style", only<string>("fontStyle"));
  push(decls, "text-decoration", only<string>("textDecoration"));
  push(decls, "color", only<string>("color"));

  push(decls, "background-color", only<string>("backgroundColor"));
  const bgImage = only<string>("backgroundImage");
  if (bgImage) push(decls, "background-image", `url("${bgImage}")`);
  push(decls, "background-size", only<string>("backgroundSize"));
  push(decls, "background-position", only<string>("backgroundPosition"));
  if (bgImage) push(decls, "background-repeat", "no-repeat");

  push(decls, "border-style", only<string>("borderStyle"));
  const bw = only<Record<string, number | undefined>>("borderWidth");
  if (bw) {
    push(decls, "border-top-width", px(bw.top));
    push(decls, "border-right-width", px(bw.right));
    push(decls, "border-bottom-width", px(bw.bottom));
    push(decls, "border-left-width", px(bw.left));
  }
  push(decls, "border-color", only<string>("borderColor"));
  const radius = only<Record<string, number | undefined>>("borderRadius");
  if (radius) {
    push(decls, "border-top-left-radius", px(radius.topLeft));
    push(decls, "border-top-right-radius", px(radius.topRight));
    push(decls, "border-bottom-right-radius", px(radius.bottomRight));
    push(decls, "border-bottom-left-radius", px(radius.bottomLeft));
  }
  const shadow = only<string>("shadow");
  push(decls, "box-shadow", shadow ? SHADOWS[shadow] : undefined);
  const opacity = only<number>("opacity");
  push(decls, "opacity", opacity === undefined ? undefined : String(opacity));

  const overflowHidden = only<boolean>("overflowHidden");
  if (overflowHidden !== undefined) {
    push(decls, "overflow", overflowHidden ? "hidden" : "visible");
  }
  const zIndex = only<number>("zIndex");
  if (zIndex !== undefined) {
    push(decls, "position", "relative");
    push(decls, "z-index", String(zIndex));
  }

  // A transition only makes sense alongside a hover state, and is limited to
  // the properties hover can change.
  const transition = only<number>("transition");
  if (transition !== undefined) {
    push(
      decls,
      "transition",
      `color ${transition}ms, background-color ${transition}ms, border-color ${transition}ms, opacity ${transition}ms`,
    );
  }

  return decls;
}

/** Declarations for the element's `:hover` rule. */
function hoverDeclarationsFor(
  style: ElementStyle,
  breakpoint: Breakpoint,
): Decls {
  const decls: Decls = [];
  const only = <T>(key: keyof ElementStyle): T | undefined => {
    const value = at(style[key] as Responsive<T> | undefined, breakpoint);
    if (breakpoint === "base") return value;
    const parent = at(
      style[key] as Responsive<T> | undefined,
      breakpoint === "mobile" ? "tablet" : "base",
    );
    return value === parent ? undefined : value;
  };

  push(decls, "color", only<string>("hoverColor"));
  push(decls, "background-color", only<string>("hoverBackgroundColor"));
  push(decls, "border-color", only<string>("hoverBorderColor"));
  const opacity = only<number>("hoverOpacity");
  push(decls, "opacity", opacity === undefined ? undefined : String(opacity));
  return decls;
}

export type ElementCss = {
  /** Declarations that apply at every width. */
  base: string;
  /** Declarations per override breakpoint, keyed by breakpoint. */
  overrides: Partial<Record<Exclude<Breakpoint, "base">, string>>;
  /** `:hover` declarations, keyed by breakpoint. */
  hover: Partial<Record<Breakpoint, string>>;
};

/** Builds the rule bodies for one element's style bag. */
export function styleToCss(style: ElementStyle): ElementCss {
  const overrides: ElementCss["overrides"] = {};
  for (const breakpoint of ["tablet", "mobile"] as const) {
    const decls = declarationsFor(style, breakpoint);
    if (decls.length > 0) overrides[breakpoint] = decls.join(";");
  }

  const hover: ElementCss["hover"] = {};
  for (const breakpoint of ["base", "tablet", "mobile"] as const) {
    const decls = hoverDeclarationsFor(style, breakpoint);
    if (decls.length > 0) hover[breakpoint] = decls.join(";");
  }

  return { base: declarationsFor(style, "base").join(";"), overrides, hover };
}

/** The class name an element's generated rules are attached to. */
export function elementClassName(id: string): string {
  return `el-${id}`;
}

/** One element's rules, already reduced to declaration strings. */
export type Rule = {
  selector: string;
  base?: string;
  tablet?: string;
  mobile?: string;
};

/**
 * Emits a responsive numeric property (e.g. a Spacer's height) as rules for a
 * selector. Used for widget props that are responsive but are not part of the
 * shared style vocabulary.
 */
export function responsiveLengthRule(
  selector: string,
  properties: string[],
  value: Responsive<number> | undefined,
): Rule | null {
  if (!value) return null;
  const rule: Rule = { selector };
  for (const breakpoint of ["base", "tablet", "mobile"] as const) {
    const resolved = resolveResponsive(value, breakpoint);
    if (resolved === undefined) continue;
    if (breakpoint !== "base") {
      const wider = resolveResponsive(
        value,
        breakpoint === "mobile" ? "tablet" : "base",
      );
      if (resolved === wider) continue;
    }
    rule[breakpoint] = properties.map((p) => `${p}:${resolved}px`).join(";");
  }
  return rule.base || rule.tablet || rule.mobile ? rule : null;
}

/**
 * Assembles rules into a stylesheet. Media queries come after every base rule
 * so overrides always win, regardless of element order.
 */
export function buildStylesheetFromRules(rules: Rule[]): string {
  const base: string[] = [];
  const tablet: string[] = [];
  const mobile: string[] = [];

  for (const rule of rules) {
    if (rule.base) base.push(`${rule.selector}{${rule.base}}`);
    if (rule.tablet) tablet.push(`${rule.selector}{${rule.tablet}}`);
    if (rule.mobile) mobile.push(`${rule.selector}{${rule.mobile}}`);
  }

  const parts = [base.join("")];
  if (tablet.length > 0) {
    parts.push(
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.tablet}px){${tablet.join("")}}`,
    );
  }
  if (mobile.length > 0) {
    parts.push(
      `@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){${mobile.join("")}}`,
    );
  }
  return parts.filter(Boolean).join("");
}

/** Builds one stylesheet for a whole tree's style bags. */
export function buildStylesheet(
  entries: { id: string; style: ElementStyle }[],
  extraRules: Rule[] = [],
): string {
  const rules: Rule[] = [];
  for (const entry of entries) {
    const css = styleToCss(entry.style);
    const selector = `.${elementClassName(entry.id)}`;
    rules.push({
      selector,
      base: css.base || undefined,
      tablet: css.overrides.tablet,
      mobile: css.overrides.mobile,
    });
    if (css.hover.base || css.hover.tablet || css.hover.mobile) {
      rules.push({
        selector: `${selector}:hover`,
        base: css.hover.base,
        tablet: css.hover.tablet,
        mobile: css.hover.mobile,
      });
    }
  }
  return buildStylesheetFromRules([...rules, ...extraRules]);
}
