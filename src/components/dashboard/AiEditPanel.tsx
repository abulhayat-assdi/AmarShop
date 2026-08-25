"use client";

import { useActionState } from "react";
import { aiEditAction } from "@/app/dashboard/editor/ai/actions";
import type { AiEditState } from "@/lib/ai/types";

export function AiEditPanel({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState<AiEditState, FormData>(
    aiEditAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <textarea
        name="instruction"
        rows={3}
        required
        disabled={!configured}
        placeholder='e.g. "Make the hero banner dark blue and add a contact section at the bottom"'
        className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 disabled:opacity-60 dark:border-white/20 dark:focus:border-white/50"
      />

      {!configured && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          AI editing is not configured — set ANTHROPIC_API_KEY on the server to
          enable it.
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !configured}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply with AI"}
      </button>
    </form>
  );
}
