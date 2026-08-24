import type { Data } from "@measured/puck";
import { parseBlocks } from "@/lib/blocks/schemas";

/**
 * Converts between our stored block format (`{ type, data }[]`, spec §5.3) and
 * Puck's editor data (`{ content: { type, props }[] }`). Puck needs a unique
 * `id` on each item's props; we add/strip it here so `site_config` stays clean.
 */
export function blocksToPuckData(blocks: unknown): Data {
  const parsed = parseBlocks(blocks);
  return {
    root: {},
    content: parsed.map((block, index) => ({
      type: block.type,
      props: { ...block.data, id: `${block.type}-${index}` },
    })),
  } as Data;
}

export type EditorBlock = { type: string; data: Record<string, unknown> };

export function puckDataToBlocks(data: Data): EditorBlock[] {
  const content = (data.content ?? []) as {
    type: string;
    props: Record<string, unknown>;
  }[];
  return content.map(({ type, props }) => {
    const blockData = { ...props };
    delete blockData.id;
    return { type, data: blockData };
  });
}
