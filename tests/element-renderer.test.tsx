import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ElementRenderer } from "@/components/elements/ElementRenderer";
import { buildStylesheet } from "@/lib/elements/css";
import { collectStyles, parseTree } from "@/lib/elements/tree";
import { widgetRules } from "@/lib/elements/widget-rules";

function render(tree: unknown): string {
  return renderToStaticMarkup(<ElementRenderer tree={tree} />);
}

describe("ElementRenderer", () => {
  it("renders nothing for an empty or invalid tree", () => {
    expect(render([])).toBe("");
    expect(render(null)).toBe("");
    expect(render([{ type: "Unknown" }])).toBe("");
  });

  it("renders a section/column/widget nesting", () => {
    const html = render([
      {
        id: "sec-1",
        type: "Section",
        props: { htmlTag: "header" },
        children: [
          {
            id: "col-1",
            type: "Column",
            children: [
              {
                id: "h-1",
                type: "Heading",
                props: { text: "Hello", level: "h1" },
              },
            ],
          },
        ],
      },
    ]);
    expect(html).toContain("<header");
    expect(html).toContain("el-sec-1");
    expect(html).toContain('class="el-col-1 el-column"');
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
  });

  it("emits the generated stylesheet before the markup", () => {
    const html = render([
      {
        id: "h-1",
        type: "Heading",
        props: { text: "x" },
        style: { color: "#ff0000" },
      },
    ]);
    expect(html.indexOf(".el-h-1{color:#ff0000}")).toBeLessThan(
      html.indexOf("<h2"),
    );
  });

  it("escapes text rather than rendering it as markup", () => {
    const html = render([
      {
        id: "t-1",
        type: "Text",
        props: { text: '<script>alert(1)</script> & "quoted"' },
      },
    ]);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("neutralises unsafe hrefs", () => {
    const html = render([
      {
        id: "b-1",
        type: "Button",
        props: { text: "Go", href: "javascript:alert(1)" },
      },
    ]);
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("never lets a style value escape its rule", () => {
    const html = render([
      {
        id: "h-1",
        type: "Heading",
        props: { text: "x" },
        style: { color: "}body{display:none}", fontSize: 20 },
      },
    ]);
    expect(html).toContain(".el-h-1{font-size:20px}");
    expect(html).not.toContain("display:none");
  });

  it("adds rel=noopener when a button opens a new tab", () => {
    const html = render([
      {
        id: "b-1",
        type: "Button",
        props: { text: "Go", href: "https://example.com", newTab: true },
      },
    ]);
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("converts YouTube links to an embed and keeps unknown ones as <video>", () => {
    expect(
      render([
        {
          id: "v-1",
          type: "Video",
          props: { url: "https://youtu.be/abc123xyz" },
        },
      ]),
    ).toContain("https://www.youtube.com/embed/abc123xyz");

    expect(
      render([
        {
          id: "v-2",
          type: "Video",
          props: { url: "https://cdn.example/a.mp4" },
        },
      ]),
    ).toContain("<video");
  });

  it("skips images and videos with no source", () => {
    expect(render([{ id: "i-1", type: "Image", props: {} }])).not.toContain(
      "<img",
    );
    const video = render([{ id: "v-1", type: "Video", props: {} }]);
    expect(video).not.toContain("<video");
    expect(video).not.toContain("<iframe");
  });

  it("stacks columns at the configured breakpoint", () => {
    const html = render([
      {
        id: "s-1",
        type: "Section",
        props: { stackOn: "tablet" },
        children: [],
      },
    ]);
    expect(html).toContain('data-stack="tablet"');
  });
});

describe("widgetRules", () => {
  it("emits responsive height for a Spacer", () => {
    const tree = parseTree([
      {
        id: "sp-1",
        type: "Spacer",
        props: { height: { base: 80, mobile: 24 } },
      },
    ]);
    const css = buildStylesheet(collectStyles(tree), widgetRules(tree));
    expect(css).toContain(".el-sp-1{height:80px}");
    expect(css).toContain("@media (max-width:767px){.el-sp-1{height:24px}}");
  });

  it("sizes an Icon's svg", () => {
    const tree = parseTree([
      { id: "ic-1", type: "Icon", props: { name: "cart", size: 48 } },
    ]);
    const css = buildStylesheet(collectStyles(tree), widgetRules(tree));
    expect(css).toContain(".el-ic-1 svg{width:48px;height:48px}");
  });
});
