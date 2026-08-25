import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseBlocks } from "@/lib/blocks/schemas";

const SITE_TYPES = ["ecommerce", "blog", "portfolio", "agency", "landing"];
const dir = join(process.cwd(), "templates");
const templateDirs = existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())
  : [];

describe("starter templates", () => {
  it("ships at least one template", () => {
    expect(templateDirs.length).toBeGreaterThan(0);
  });

  for (const d of templateDirs) {
    it(`${d.name}: valid JSON, every block renders, known siteType`, () => {
      const file = join(dir, d.name, "template.json");
      expect(existsSync(file)).toBe(true);
      const tpl = JSON.parse(readFileSync(file, "utf8")) as {
        blocks: unknown[];
        siteType: string;
        slug: string;
      };
      expect(Array.isArray(tpl.blocks)).toBe(true);
      // No block is dropped by the renderer's validation.
      expect(parseBlocks(tpl.blocks).length).toBe(tpl.blocks.length);
      expect(SITE_TYPES).toContain(tpl.siteType);
      expect(tpl.slug).toBe(d.name);
    });
  }
});
