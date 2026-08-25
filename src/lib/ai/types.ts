import type { Block } from "@/lib/blocks/schemas";

/** Result of an in-editor AI edit (client-safe module). */
export type AiEditResult =
  | { ok: true; blocks: Block[] }
  | { ok: false; error: string };
