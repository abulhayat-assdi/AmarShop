import { describe, expect, it } from "vitest";
import { blocksToPuckData, puckDataToBlocks } from "@/lib/editor/mapping";

describe("editor mapping", () => {
  it("adds a Puck id in content and strips it back out on save", () => {
    const blocks = [{ type: "Footer", data: { text: "hi", links: [] } }];
    const puck = blocksToPuckData(blocks);
    expect(puck.content).toHaveLength(1);
    expect((puck.content[0].props as Record<string, unknown>).id).toBeDefined();

    const back = puckDataToBlocks(puck);
    expect(back[0].type).toBe("Footer");
    expect(back[0].data.id).toBeUndefined();
    expect(back[0].data.text).toBe("hi");
  });

  it("drops invalid blocks (via parseBlocks) before mapping", () => {
    const puck = blocksToPuckData([{ type: "Bogus", data: {} }]);
    expect(puck.content).toHaveLength(0);
  });
});
