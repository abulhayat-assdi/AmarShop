"use client";

import { useRef, useState } from "react";
import { uploadEditorMedia } from "@/lib/editor/media-action";
import { inputClass } from "./controls";

/**
 * A URL field with an upload button (spec §7.1).
 *
 * Shop owners should not have to find a URL for their own photos, so the field
 * accepts a direct upload: the file goes to the tenant's self-hosted store and
 * the returned path fills the input. Pasting a URL still works for media hosted
 * elsewhere.
 */
export function MediaField({
  value,
  onChange,
  accept = "image/*",
  kind = "image",
}: {
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  kind?: "image" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPending(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadEditorMedia(data);
      if (result.ok) onChange(result.url);
      else setError(result.error);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value &&
        (kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-24 w-full rounded-md border border-black/10 object-contain dark:border-white/15"
          />
        ) : (
          <p className="truncate rounded-md border border-black/10 px-2 py-1.5 text-[11px] dark:border-white/15">
            {value}
          </p>
        ))}

      <input
        type="text"
        value={value}
        placeholder="https://… or upload below"
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs underline opacity-60 hover:opacity-100"
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
