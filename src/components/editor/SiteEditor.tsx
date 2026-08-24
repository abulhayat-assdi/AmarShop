"use client";

import "@measured/puck/puck.css";
import { type Data, Puck } from "@measured/puck";
import Link from "next/link";
import { useState } from "react";
import { saveSiteBlocks } from "@/app/dashboard/editor/actions";
import { puckDataToBlocks } from "@/lib/editor/mapping";
import { puckConfig } from "@/lib/editor/puck-config";

/**
 * Visual site editor (spec §5.7). Puck edits the structured block data and its
 * Publish button saves it back to the tenant's site_config. Full-screen overlay
 * with an Exit link back to the dashboard.
 */
export function SiteEditor({ initialData }: { initialData: Data }) {
  const [status, setStatus] = useState<string | null>(null);

  async function handlePublish(data: Data) {
    setStatus("Saving…");
    try {
      await saveSiteBlocks(puckDataToBlocks(data));
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
              <Link href="/dashboard" className="px-3 py-1.5 text-sm underline">
                Exit
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
