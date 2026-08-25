import { describe, expect, it } from "vitest";
import {
  parseTemplateImport,
  serialiseTemplate,
  slugifyTemplateSlug,
  starterBlocks,
  uniqueTemplateSlug,
} from "@/lib/admin/template-io";

describe("slugifyTemplateSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyTemplateSlug("Fashion Store 2")).toBe("fashion-store-2");
    expect(slugifyTemplateSlug("  Modern   Agency  ")).toBe("modern-agency");
  });

  it("strips unsafe characters and edge hyphens", () => {
    expect(slugifyTemplateSlug("A/B?Test!")).toBe("a-b-test");
    expect(slugifyTemplateSlug("--hello--")).toBe("hello");
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(slugifyTemplateSlug("ফ্যাশন")).toBe("");
    expect(slugifyTemplateSlug("!!!")).toBe("");
  });
});

describe("uniqueTemplateSlug", () => {
  it("returns the base when free", () => {
    expect(uniqueTemplateSlug("shop", ["blog"])).toBe("shop");
  });

  it("appends the next free suffix", () => {
    expect(uniqueTemplateSlug("shop", ["shop"])).toBe("shop-2");
    expect(uniqueTemplateSlug("shop", ["shop", "shop-2"])).toBe("shop-3");
  });
});

const validFile = JSON.stringify({
  name: "Test Store",
  slug: "test-store",
  category: "fashion",
  siteType: "ecommerce",
  blocks: [
    { type: "Navbar", data: { logoText: "Test" } },
    { type: "Footer", data: { text: "hi" } },
  ],
});

describe("parseTemplateImport", () => {
  it("accepts a well-formed template file", () => {
    const result = parseTemplateImport(validFile);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.slug).toBe("test-store");
      expect(result.value.blocks).toHaveLength(2);
    }
  });

  it("rejects invalid JSON", () => {
    expect(parseTemplateImport("{ nope").ok).toBe(false);
  });

  it("rejects a bad slug or unknown site type", () => {
    expect(
      parseTemplateImport(validFile.replace('"test-store"', '"Test Store"')).ok,
    ).toBe(false);
    expect(
      parseTemplateImport(validFile.replace('"ecommerce"', '"shop"')).ok,
    ).toBe(false);
  });

  it("drops unknown blocks and rejects when none survive", () => {
    const mixed = JSON.parse(validFile);
    mixed.blocks = [
      { type: "Navbar", data: {} },
      { type: "Nope", data: {} },
    ];
    const result = parseTemplateImport(JSON.stringify(mixed));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.blocks).toHaveLength(1);

    mixed.blocks = [{ type: "Nope", data: {} }];
    expect(parseTemplateImport(JSON.stringify(mixed)).ok).toBe(false);
  });
});

describe("serialiseTemplate", () => {
  it("round-trips through parseTemplateImport", () => {
    const json = serialiseTemplate({
      name: "Test Store",
      slug: "test-store",
      category: "fashion",
      siteType: "ecommerce",
      previewUrl: null,
      structureJson: [{ type: "Navbar", data: { logoText: "Test" } }],
    });
    const result = parseTemplateImport(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Test Store");
      expect(result.value.blocks[0].type).toBe("Navbar");
    }
  });

  it("omits an unset preview URL", () => {
    const json = serialiseTemplate({
      name: "T",
      slug: "t",
      category: "c",
      siteType: "blog",
      previewUrl: null,
      structureJson: [{ type: "Footer", data: {} }],
    });
    expect(JSON.parse(json)).not.toHaveProperty("previewUrl");
  });
});

describe("starterBlocks", () => {
  it("produces a valid starter for every site type", () => {
    for (const type of [
      "ecommerce",
      "blog",
      "portfolio",
      "agency",
      "landing",
    ] as const) {
      const blocks = starterBlocks(type);
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].type).toBe("Navbar");
    }
  });

  it("uses a type-appropriate main block", () => {
    expect(starterBlocks("ecommerce")[2].type).toBe("ProductGrid");
    expect(starterBlocks("blog")[2].type).toBe("BlogList");
    expect(starterBlocks("portfolio")[2].type).toBe("Gallery");
  });
});
