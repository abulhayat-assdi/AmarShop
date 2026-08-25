"use client";

import "@measured/puck/puck.css";
import { type Data, Puck } from "@measured/puck";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  blocksToPuckData,
  type EditorBlock,
  puckDataToBlocks,
} from "@/lib/editor/mapping";
import { puckConfig } from "@/lib/editor/puck-config";
import { AiEditPanel } from "./AiEditPanel";

/**
 * Visual block editor (spec §5.7). Puck edits the structured block data and its
 * Publish button hands the blocks to the `onSave` server action supplied by the
 * page. Used both for a tenant's live site (`/dashboard/editor`) and for master
 * templates in the super-admin (`/admin/templates/[id]/edit`).
 *
 * AI editing lives in the same screen: the panel reads the current canvas and
 * replaces it with the AI's result, which the user then reviews and publishes.
 * Puck is remounted (via `editorKey`) when the AI rewrites the canvas, since its
 * internal state is seeded from `data`.
 */
export function SiteEditor({
  initialData,
  onSave,
  exitHref = "/dashboard",
  exitLabel = "Exit",
  aiConfigured = false,
}: {
  initialData: Data;
  onSave: (blocks: EditorBlock[]) => Promise<void>;
  exitHref?: string;
  exitLabel?: string;
  aiConfigured?: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<Data>(initialData);
  const [editorKey, setEditorKey] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);

  // Puck's onChange is the source of truth for what is on the canvas right now;
  // a ref keeps the AI panel reading the latest value without re-rendering it.
  const liveData = useRef<Data>(initialData);

  function handleChange(next: Data) {
    liveData.current = next;
  }

  async function handlePublish(next: Data) {
    setStatus("Saving…");
    try {
      await onSave(puckDataToBlocks(next));
      setStatus("Saved");
    } catch {
      setStatus("Save failed");
    }
  }

  function handleAiApplied(blocks: EditorBlock[]) {
    const next = blocksToPuckData(blocks);
    liveData.current = next;
    setData(next);
    setEditorKey((key) => key + 1);
  }

  return (
    <div className="bg-background fixed inset-0 z-50">
      <Puck
        key={editorKey}
        config={puckConfig}
        data={data}
        onChange={handleChange}
        onPublish={handlePublish}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <Link href={exitHref} className="px-3 py-1.5 text-sm underline">
                {exitLabel}
              </Link>
              <button
                type="button"
                onClick={() => setAiOpen((open) => !open)}
                aria-pressed={aiOpen}
                className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                AI edit
              </button>
              {children}
            </>
          ),
        }}
      />

      {aiOpen && (
        <AiEditPanel
          configured={aiConfigured}
          getBlocks={() => puckDataToBlocks(liveData.current)}
          onApplied={handleAiApplied}
          onClose={() => setAiOpen(false)}
        />
      )}

      {status && (
        <div className="bg-foreground text-background fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-md px-4 py-2 text-sm">
          {status}
        </div>
      )}
    </div>
  );
}
