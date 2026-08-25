import { describe, expect, it } from "vitest";
import { parseBlocks } from "@/lib/blocks/schemas";

describe("parseBlocks", () => {
  it("returns [] for non-arrays", () => {
    expect(parseBlocks(null)).toEqual([]);
    expect(parseBlocks({})).toEqual([]);
    expect(parseBlocks(undefined)).toEqual([]);
  });

  it("parses valid blocks and fills field defaults", () => {
    const blocks = parseBlocks([
      { type: "Navbar", data: { logoText: "Shop" } },
      { type: "ProductGrid", data: { products: [] } },
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("Navbar");
    const grid = blocks[1];
    if (grid.type === "ProductGrid") {
      expect(grid.data.columns).toBe(3); // default
    }
  });

  it("drops unknown or malformed blocks", () => {
    const blocks = parseBlocks([
      { type: "Nope", data: {} },
      { type: "Navbar" }, // missing data
      "garbage",
      { type: "Footer", data: { text: "ok" } },
    ]);
    expect(blocks.map((b) => b.type)).toEqual(["Footer"]);
  });

  it("coerces unsafe hrefs to #", () => {
    const blocks = parseBlocks([
      {
        type: "Navbar",
        data: { links: [{ label: "x", href: "javascript:alert(1)" }] },
      },
    ]);
    const nav = blocks[0];
    if (nav.type === "Navbar") {
      expect(nav.data.links[0].href).toBe("#");
    }
  });
});
