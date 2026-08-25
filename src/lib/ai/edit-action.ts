"use server";

import { auth } from "@/auth";
import type { EditorBlock } from "@/lib/editor/mapping";
import { applyAiEdit } from "./editor";
import type { AiEditResult } from "./types";

/**
 * AI edit invoked from inside the visual editor (spec §5.7).
 *
 * It takes the blocks currently open in the editor — including unsaved changes —
 * and returns the AI's proposed replacement. Nothing is persisted here: the
 * editor shows the result so the user can review, undo, or keep editing, and
 * only Publish writes it. That keeps the AI on the same footing as any other
 * editor change and works for both a tenant's site and a master template.
 */
export async function aiEditBlocks(
  blocks: EditorBlock[],
  instruction: string,
): Promise<AiEditResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "You are not signed in." };

  const trimmed = instruction.trim();
  if (!trimmed) {
    return { ok: false, error: "Please describe the change you want." };
  }

  try {
    const updated = await applyAiEdit(blocks, trimmed);
    return { ok: true, blocks: updated };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI edit failed.",
    };
  }
}
