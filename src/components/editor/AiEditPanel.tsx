"use client";

import { useState } from "react";
import { aiEditBlocks } from "@/lib/ai/edit-action";
import type { EditorBlock } from "@/lib/editor/mapping";

/**
 * AI edit panel docked inside the visual editor (spec §5.7). It reads whatever
 * is currently on the canvas (including unsaved edits), asks the AI for a
 * revised layout, and hands the result back to the editor — nothing is saved
 * until the user hits Publish, so an AI change can be reviewed or undone like
 * any other edit.
 */
export function AiEditPanel({
  configured,
  getBlocks,
  onApplied,
  onClose,
}: {
  configured: boolean;
  getBlocks: () => EditorBlock[];
  onApplied: (blocks: EditorBlock[]) => void;
  onClose: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleApply() {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await aiEditBlocks(getBlocks(), instruction);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onApplied(result.blocks);
      setInstruction("");
      setNotice(
        `Applied — ${result.blocks.length} block(s) on the canvas. Review it, then Publish to save.`,
      );
    } catch {
      setError("AI edit failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="bg-background fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-lg border border-black/15 p-4 shadow-xl dark:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">AI edit</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Describe a change in plain language.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI edit"
          className="rounded-md px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      <textarea
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        rows={4}
        disabled={!configured || pending}
        placeholder='e.g. "Make the hero banner dark blue and add a contact section at the bottom"'
        className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 disabled:opacity-60 dark:border-white/20 dark:focus:border-white/50"
      />

      {!configured && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          AI editing is not configured — set AI_API_KEY (and optionally
          AI_PROVIDER / AI_BASE_URL / AI_MODEL) on the server to enable it.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {notice && (
        <p className="text-xs text-green-600 dark:text-green-400">{notice}</p>
      )}

      <button
        type="button"
        onClick={handleApply}
        disabled={pending || !configured || !instruction.trim()}
        className="bg-foreground text-background self-start rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply with AI"}
      </button>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        AI changes land on the canvas only — press Publish to save them.
      </p>
    </aside>
  );
}
