import { describe, expect, it } from "vitest";
import {
  buildStylesheet,
  elementClassName,
  styleToCss,
} from "@/lib/elements/css";
import { resolveResponsive } from "@/lib/elements/responsive";
import { parseStyle } from "@/lib/elements/style";
import {
  collectStyles,
  createElementId,
  findNode,
  insertNodes,
  moveNode,
  parseTree,
  removeNode,
  updateNode,
} from "@/lib/elements/tree";
import { parseWidgetProps } from "@/lib/elements/widgets";

describe("parseStyle", () => {
  it("keeps valid tokens and normalises bare values to `base`", () => {
    const style = parseStyle({ fontSize: 24, color: "#ff0000" });
    expect(style.fontSize).toEqual({ base: 24 });
    expect(style.color).toEqual({ base: "#ff0000" });
  });

  it("accepts per-breakpoint values", () => {
    const style = parseStyle({ fontSize: { base: 48, mobile: 24 } });
    expect(resolveResponsive(style.fontSize, "mobile")).toBe(24);
    expect(resolveResponsive(style.fontSize, "tablet")).toBe(48);
  });

  it("drops colours that are not safe tokens", () => {
    for (const bad of [
      "red; background: url(javascript:alert(1))",
      "}body{display:none}",
      "expression(alert(1))",
      "url(http://evil)",
    ]) {
      expect(parseStyle({ color: bad }).color?.base).toBeUndefined();
    }
  });

  it("drops background images that are not http(s) or site-relative", () => {
    expect(
      parseStyle({ backgroundImage: "javascript:alert(1)" }).backgroundImage
        ?.base,
    ).toBeUndefined();
    expect(
      parseStyle({ backgroundImage: "data:image/svg+xml,<svg onload=x>" })
        .backgroundImage?.base,
    ).toBeUndefined();
    expect(
      parseStyle({ backgroundImage: "https://cdn.example/a.png" })
        .backgroundImage?.base,
    ).toBe("https://cdn.example/a.png");
  });

  it("drops out-of-range numbers rather than emitting them", () => {
    expect(parseStyle({ fontSize: 99999 }).fontSize?.base).toBeUndefined();
    expect(parseStyle({ opacity: 5 }).opacity?.base).toBeUndefined();
    expect(
      parseStyle({ fontSize: "not a number" }).fontSize?.base,
    ).toBeUndefined();
  });
});

describe("styleToCss", () => {
  it("emits base declarations", () => {
    const css = styleToCss(parseStyle({ fontSize: 20, color: "#112233" }));
    expect(css.base).toContain("font-size:20px");
    expect(css.base).toContain("color:#112233");
  });

  it("emits only overridden properties in a breakpoint", () => {
    const css = styleToCss(
      parseStyle({ fontSize: { base: 48, mobile: 24 }, color: "#000000" }),
    );
    expect(css.overrides.mobile).toBe("font-size:24px");
    expect(css.overrides.mobile).not.toContain("color");
    expect(css.overrides.tablet).toBeUndefined();
  });

  it("never emits a declaration for a rejected value", () => {
    const css = styleToCss(parseStyle({ color: "}x{", fontSize: 16 }));
    expect(css.base).not.toContain("}");
    expect(css.base).toBe("font-size:16px");
  });
});

describe("buildStylesheet", () => {
  it("groups overrides into media queries after the base rules", () => {
    const sheet = buildStylesheet([
      { id: "a", style: parseStyle({ fontSize: { base: 40, mobile: 20 } }) },
      { id: "b", style: parseStyle({ color: "#ffffff" }) },
    ]);
    expect(sheet.indexOf(".el-a{font-size:40px}")).toBe(0);
    expect(sheet).toContain(".el-b{color:#ffffff}");
    expect(sheet).toContain("@media (max-width:767px){.el-a{font-size:20px}}");
    expect(sheet.indexOf("@media")).toBeGreaterThan(sheet.indexOf(".el-b"));
  });

  it("omits empty rules", () => {
    expect(buildStylesheet([{ id: "a", style: {} }])).toBe("");
  });
});

describe("parseWidgetProps", () => {
  it("fills defaults", () => {
    expect(parseWidgetProps("Heading", {})).toMatchObject({
      text: "Heading",
      level: "h2",
    });
  });

  it("coerces unsafe hrefs to #", () => {
    expect(
      parseWidgetProps("Button", { href: "javascript:alert(1)" }).href,
    ).toBe("#");
    expect(parseWidgetProps("Button", { href: "/shop" }).href).toBe("/shop");
  });

  it("falls back on out-of-range or unknown enum values", () => {
    expect(parseWidgetProps("Heading", { level: "h9" }).level).toBe("h2");
    expect(parseWidgetProps("Divider", { thickness: 9999 }).thickness).toBe(1);
    expect(parseWidgetProps("Icon", { name: "skull" }).name).toBe("star");
  });
});

const sample = () =>
  parseTree([
    {
      id: "sec-1",
      type: "Section",
      children: [
        {
          id: "col-1",
          type: "Column",
          children: [
            { id: "head-1", type: "Heading", props: { text: "Hi" } },
            { id: "btn-1", type: "Button", props: { text: "Buy" } },
          ],
        },
      ],
    },
  ]);

describe("parseTree", () => {
  it("builds a nested tree and preserves valid ids", () => {
    const tree = sample();
    expect(tree).toHaveLength(1);
    expect(findNode(tree, "head-1")?.props.text).toBe("Hi");
    expect(findNode(tree, "col-1")?.children).toHaveLength(2);
  });

  it("drops unknown element types", () => {
    const tree = parseTree([
      { type: "Heading" },
      { type: "ScriptTag" },
      "nonsense",
      null,
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe("Heading");
  });

  it("mints ids that are missing or malformed, and de-duplicates", () => {
    const tree = parseTree([
      { type: "Heading" },
      { id: "Bad Id!", type: "Heading" },
      { id: "dup", type: "Heading" },
      { id: "dup", type: "Heading" },
    ]);
    const ids = tree.map((n) => n.id);
    expect(new Set(ids).size).toBe(4);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
  });

  it("ignores children on non-containers", () => {
    const tree = parseTree([
      { type: "Heading", children: [{ type: "Heading" }] },
    ]);
    expect(tree[0].children).toBeUndefined();
  });

  it("returns [] for non-arrays", () => {
    expect(parseTree(null)).toEqual([]);
    expect(parseTree({})).toEqual([]);
  });
});

describe("tree operations", () => {
  it("updates a node without touching siblings", () => {
    const tree = sample();
    const next = updateNode(tree, "head-1", (node) => ({
      ...node,
      props: { ...node.props, text: "Changed" },
    }));
    expect(next).not.toBeNull();
    expect(findNode(next!, "head-1")?.props.text).toBe("Changed");
    expect(findNode(next!, "btn-1")?.props.text).toBe("Buy");
    // original is untouched
    expect(findNode(tree, "head-1")?.props.text).toBe("Hi");
  });

  it("returns null when the id is absent", () => {
    expect(updateNode(sample(), "nope", (n) => n)).toBeNull();
    expect(removeNode(sample(), "nope")).toBeNull();
    expect(moveNode(sample(), "nope", null, 0)).toBeNull();
  });

  it("removes a nested node", () => {
    const next = removeNode(sample(), "btn-1")!;
    expect(findNode(next, "btn-1")).toBeNull();
    expect(findNode(next, "col-1")?.children).toHaveLength(1);
  });

  it("inserts into a container at a clamped index", () => {
    const node = parseTree([{ id: "new-1", type: "Text" }])[0];
    const next = insertNodes(sample(), "col-1", 99, [node])!;
    expect(findNode(next, "col-1")?.children?.map((c) => c.id)).toEqual([
      "head-1",
      "btn-1",
      "new-1",
    ]);
  });

  it("refuses to insert into a non-container", () => {
    const node = parseTree([{ id: "new-1", type: "Text" }])[0];
    expect(insertNodes(sample(), "head-1", 0, [node])).toBeNull();
  });

  it("moves a node between parents", () => {
    const next = moveNode(sample(), "btn-1", null, 0)!;
    expect(next[0].id).toBe("btn-1");
    expect(findNode(next, "col-1")?.children).toHaveLength(1);
  });

  it("refuses to move a container into itself", () => {
    expect(moveNode(sample(), "sec-1", "col-1", 0)).toBeNull();
    expect(moveNode(sample(), "sec-1", "sec-1", 0)).toBeNull();
  });

  it("collects every node's style for the stylesheet", () => {
    expect(collectStyles(sample()).map((e) => e.id)).toEqual([
      "sec-1",
      "col-1",
      "head-1",
      "btn-1",
    ]);
  });
});

describe("createElementId / elementClassName", () => {
  it("produces unique, css-safe ids", () => {
    const ids = new Set(
      Array.from({ length: 200 }, () => createElementId("Heading")),
    );
    expect(ids.size).toBe(200);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(elementClassName(id)).toBe(`el-${id}`);
    }
  });
});

describe("hover and extra style tokens", () => {
  it("emits a :hover rule separate from the base rule", () => {
    const css = buildStylesheet([
      {
        id: "b1",
        style: parseStyle({
          backgroundColor: "#111111",
          hoverBackgroundColor: "#222222",
          transition: 200,
        }),
      },
    ]);
    expect(css).toContain(".el-b1{");
    expect(css).toContain(".el-b1:hover{background-color:#222222}");
    expect(css).toContain("transition:color 200ms");
  });

  it("keeps hover colours under the same validation", () => {
    const css = buildStylesheet([
      { id: "b1", style: parseStyle({ hoverColor: "}x{" }) },
    ]);
    expect(css).toBe("");
  });

  it("emits italic, decoration, overflow and z-index", () => {
    const css = buildStylesheet([
      {
        id: "t1",
        style: parseStyle({
          fontStyle: "italic",
          textDecoration: "underline",
          overflowHidden: true,
          zIndex: 5,
        }),
      },
    ]);
    expect(css).toContain("font-style:italic");
    expect(css).toContain("text-decoration:underline");
    expect(css).toContain("overflow:hidden");
    expect(css).toContain("z-index:5");
    expect(css).toContain("position:relative");
  });

  it("rejects an out-of-range z-index", () => {
    expect(
      buildStylesheet([{ id: "t1", style: parseStyle({ zIndex: 99999 }) }]),
    ).toBe("");
  });
});
