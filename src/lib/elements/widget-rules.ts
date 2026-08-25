import { elementClassName, responsiveLengthRule, type Rule } from "./css";
import type { Responsive } from "./responsive";
import { type ElementNode, walkTree } from "./tree";

/**
 * Extra CSS for widget props that are responsive but are not part of the shared
 * style vocabulary — a Spacer's height, an Icon's size, a Shape's height. They
 * live in the widget's own props (they are content, not styling), yet still need
 * per-breakpoint rules, so they are emitted alongside the style rules.
 */
function responsiveProp(
  node: ElementNode,
  key: string,
): Responsive<number> | undefined {
  const value = node.props[key];
  return value && typeof value === "object"
    ? (value as Responsive<number>)
    : undefined;
}

export function widgetRules(nodes: ElementNode[]): Rule[] {
  const rules: Rule[] = [];

  for (const { node } of walkTree(nodes)) {
    const selector = `.${elementClassName(node.id)}`;

    if (node.type === "Spacer") {
      const rule = responsiveLengthRule(
        selector,
        ["height"],
        responsiveProp(node, "height"),
      );
      if (rule) rules.push(rule);
    }

    if (node.type === "Shape") {
      const rule = responsiveLengthRule(
        selector,
        ["height"],
        responsiveProp(node, "height"),
      );
      if (rule) rules.push(rule);
    }

    if (node.type === "Icon") {
      // The size applies to the rendered <svg>, not the wrapper.
      const rule = responsiveLengthRule(
        `${selector} svg`,
        ["width", "height"],
        responsiveProp(node, "size"),
      );
      if (rule) rules.push(rule);
    }
  }

  return rules;
}
