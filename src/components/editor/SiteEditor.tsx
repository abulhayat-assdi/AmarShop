"use client";

import "@measured/puck/puck.css";
import { type Data, Puck } from "@measured/puck";
import Link from "next/link";
import { useState } from "react";
import { type EditorBlock, puckDataToBlocks } from "@/lib/editor/mapping";
import { puckConfig } from "@/lib/editor/puck-config";

/**
 * Visual block editor (spec §5.7). Puck edits the structured block data and its
 * Publish button hands the blocks to the `onSave` server action supplied by the
 * page. Used both for a tenant's live site (`/dashboard/editor`) and for master
 * templates in the super-admin (`/admin/templates/[id]/edit`).
 */
export function SiteEditor({
  initialData,
  onSave,
  exitHref = "/dashboard",
  exitLabel = "Exit",
}: {
  initialData: Data;
  onSave: (blocks: EditorBlock[]) => Promise<void>;
  exitHref?: string;
  exitLabel?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function handlePublish(data: Data) {
    setStatus("Saving…");
    try {
      await onSave(puckDataToBlocks(data));
      setStatus("Saved");
    } catch {
      setStatus("Save failed");
    }
  }

  return (
    <div className="bg-background fixed inset-0 z-50">
      <Puck
        config={puckConfig}
        data={initialData}
        onPublish={handlePublish}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <Link href={exitHref} className="px-3 py-1.5 text-sm underline">
                {exitLabel}
              </Link>
              {children}
            </>
          ),
        }}
      />
      {status && (
        <div className="bg-foreground text-background fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-md px-4 py-2 text-sm">
          {status}
        </div>
      )}
    </div>
  );
}
