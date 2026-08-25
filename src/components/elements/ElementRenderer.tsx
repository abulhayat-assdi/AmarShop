import { createElement } from "react";
import { buildStylesheet, elementClassName } from "@/lib/elements/css";
import { BREAKPOINT_MAX_WIDTH } from "@/lib/elements/responsive";
import {
  collectStyles,
  type ElementNode,
  parseTree,
} from "@/lib/elements/tree";
import { widgetRules } from "@/lib/elements/widget-rules";
import type { IconName } from "@/lib/elements/widgets";
import { ElementIcon } from "./ElementIcon";

/**
 * Renders an element tree (spec §5.4, §5.7).
 *
 * The tree is validated first, so unknown types and unsafe values never reach
 * the DOM — text is rendered as text, links are pattern-checked hrefs, icons
 * come from a closed catalogue. Per-element styling is not inline: one
 * stylesheet is generated for the whole tree so responsive breakpoints work.
 *
 * Layout that is structural rather than user-chosen (a Section's boxed width, a
 * Column's flex behaviour) is emitted as small scoped rules alongside it.
 */
const STRUCTURAL_CSS = `
.el-root{width:100%}
.el-section{width:100%;box-sizing:border-box}
.el-section>.el-section-inner{display:flex;flex-wrap:wrap;align-items:stretch;margin-inline:auto;width:100%;box-sizing:border-box}
.el-column{display:flex;flex-direction:column;flex:1 1 0;min-width:0;box-sizing:border-box}
.el-widget{box-sizing:border-box}
.el-image{display:block;max-width:100%;height:auto}
.el-button{display:inline-flex;align-items:center;gap:.5em;text-decoration:none;cursor:pointer;border-style:solid;border-width:0}
.el-text{white-space:pre-wrap}
.el-video{width:100%;border:0;display:block}
.el-divider-line{border-top-style:solid;margin-inline:auto}
@media (max-width:${BREAKPOINT_MAX_WIDTH.tablet}px){
.el-section[data-stack="tablet"]>.el-section-inner{flex-direction:column}
}
@media (max-width:${BREAKPOINT_MAX_WIDTH.mobile}px){
.el-section[data-stack="mobile"]>.el-section-inner,
.el-section[data-stack="tablet"]>.el-section-inner{flex-direction:column}
}
`
  .replace(/\n\s*/g, "")
  .trim();

const BUTTON_PADDING: Record<string, string> = {
  sm: "0.4rem 0.9rem",
  md: "0.6rem 1.25rem",
  lg: "0.85rem 1.75rem",
};

const SHAPE_CLIP: Record<string, string | undefined> = {
  rectangle: undefined,
  circle: "circle(50% at 50% 50%)",
  triangle: "polygon(50% 0%, 100% 100%, 0% 100%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  blob: "polygon(25% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%, 0% 25%)",
};

function prop<T>(node: ElementNode, key: string, fallback: T): T {
  const value = node.props[key];
  return (value === undefined ? fallback : value) as T;
}

function classes(node: ElementNode, ...extra: (string | false)[]): string {
  return [elementClassName(node.id), ...extra.filter(Boolean)].join(" ");
}

/** Converts a YouTube/Vimeo page URL into its embeddable form. */
function embedUrl(url: string): string | null {
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,20})/,
  );
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function renderChildren(node: ElementNode) {
  return (node.children ?? []).map((child) => (
    <RenderNode key={child.id} node={child} />
  ));
}

function RenderNode({ node }: { node: ElementNode }) {
  switch (node.type) {
    case "Section": {
      const tag = prop<string>(node, "htmlTag", "section");
      const boxed = prop<string>(node, "contentWidth", "boxed") === "boxed";
      const boxedWidth = prop(node, "boxedWidth", 1152);
      return createElement(
        tag,
        {
          id: node.id,
          "data-el-id": node.id,
          className: classes(node, "el-section"),
          "data-stack": prop<string>(node, "stackOn", "mobile"),
        },
        <div
          className="el-section-inner"
          style={boxed ? { maxWidth: `${boxedWidth}px` } : undefined}
        >
          {renderChildren(node)}
        </div>,
      );
    }

    case "Column":
      return (
        <div data-el-id={node.id} className={classes(node, "el-column")}>
          {renderChildren(node)}
        </div>
      );

    case "Heading": {
      const level = prop<string>(node, "level", "h2");
      const href = prop<string | undefined>(node, "href", undefined);
      const text = prop(node, "text", "");
      return createElement(
        level,
        { className: classes(node, "el-widget"), "data-el-id": node.id },
        href && href !== "#" ? <a href={href}>{text}</a> : text,
      );
    }

    case "Text":
      // Rendered as text, never as markup — newlines are preserved by CSS.
      return (
        <p
          data-el-id={node.id}
          className={classes(node, "el-widget", "el-text")}
        >
          {prop(node, "text", "")}
        </p>
      );

    case "Image": {
      const url = prop(node, "url", "");
      if (!url) return null;
      const ratio = prop(node, "aspectRatio", "auto");
      const image = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={prop(node, "alt", "")}
          loading="lazy"
          className="el-image"
          style={{
            objectFit: prop<"cover" | "contain" | "fill">(
              node,
              "objectFit",
              "cover",
            ),
            ...(ratio !== "auto"
              ? { aspectRatio: ratio, width: "100%", height: "auto" }
              : {}),
          }}
        />
      );
      const href = prop<string | undefined>(node, "href", undefined);
      return (
        <div data-el-id={node.id} className={classes(node, "el-widget")}>
          {href && href !== "#" ? <a href={href}>{image}</a> : image}
        </div>
      );
    }

    case "Button": {
      const icon = prop<IconName | undefined>(node, "icon", undefined);
      const iconRight = prop<string>(node, "iconPosition", "left") === "right";
      const newTab = prop(node, "newTab", false);
      return (
        <a
          data-el-id={node.id}
          className={classes(node, "el-widget", "el-button")}
          href={prop(node, "href", "#")}
          {...(newTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : null)}
          style={{ padding: BUTTON_PADDING[prop(node, "size", "md")] }}
        >
          {icon && !iconRight && <ElementIcon name={icon} size={18} />}
          {prop(node, "text", "")}
          {icon && iconRight && <ElementIcon name={icon} size={18} />}
        </a>
      );
    }

    case "Divider":
      return (
        <div data-el-id={node.id} className={classes(node, "el-widget")}>
          <div
            className="el-divider-line"
            style={{
              borderTopWidth: `${prop(node, "thickness", 1)}px`,
              borderTopStyle: prop<"solid" | "dashed" | "dotted">(
                node,
                "style",
                "solid",
              ),
              width: `${prop(node, "widthPercent", 100)}%`,
            }}
          />
        </div>
      );

    case "Spacer":
      // Height is responsive, so it comes from the generated stylesheet.
      return (
        <div
          data-el-id={node.id}
          className={classes(node, "el-widget")}
          aria-hidden="true"
        />
      );

    case "Icon": {
      const href = prop<string | undefined>(node, "href", undefined);
      const icon = <ElementIcon name={prop<IconName>(node, "name", "star")} />;
      return (
        <div data-el-id={node.id} className={classes(node, "el-widget")}>
          {href && href !== "#" ? <a href={href}>{icon}</a> : icon}
        </div>
      );
    }

    case "Shape":
      return (
        <div
          data-el-id={node.id}
          className={classes(node, "el-widget")}
          aria-hidden="true"
          style={{
            clipPath: SHAPE_CLIP[prop(node, "shape", "rectangle")],
          }}
        />
      );

    case "Video": {
      const url = prop(node, "url", "");
      if (!url) return null;
      const ratio = prop(node, "aspectRatio", "16/9");
      const embed = embedUrl(url);
      return (
        <div
          data-el-id={node.id}
          className={classes(node, "el-widget")}
          style={{ aspectRatio: ratio }}
        >
          {embed ? (
            <iframe
              className="el-video"
              style={{ height: "100%" }}
              src={embed}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className="el-video"
              style={{ height: "100%" }}
              src={url}
              controls={prop(node, "controls", true)}
            />
          )}
        </div>
      );
    }
  }
}

/**
 * Renders a whole site/template. Emits the tree's generated stylesheet once,
 * ahead of the markup, so styles are in place on first paint.
 */
export function ElementRenderer({ tree }: { tree: unknown }) {
  const nodes = parseTree(tree);
  if (nodes.length === 0) return null;
  const stylesheet = buildStylesheet(collectStyles(nodes), widgetRules(nodes));

  return (
    <div className="el-root">
      <style
        // Values are validated primitives from ./style, so this string is built
        // from a closed vocabulary — see the CSS-injection tests.
        dangerouslySetInnerHTML={{ __html: STRUCTURAL_CSS + stylesheet }}
      />
      {nodes.map((node) => (
        <RenderNode key={node.id} node={node} />
      ))}
    </div>
  );
}
