"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createTemplateAction,
  type TemplateFormState,
} from "@/app/admin/templates/actions";
import { SITE_TYPES } from "@/lib/admin/template-io";

type SourceOption = "blank" | "duplicate" | "import";

const SOURCES: { key: SourceOption; label: string; hint: string }[] = [
  {
    key: "blank",
    label: "Start blank",
    hint: "Creates a minimal starter layout you then edit visually.",
  },
  {
    key: "duplicate",
    label: "Duplicate existing",
    hint: "Copies another template's blocks as the starting point.",
  },
  {
    key: "import",
    label: "Import JSON",
    hint: "Paste a template.json file exported from this panel.",
  },
];

const fieldClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20";
const labelClass = "flex flex-col gap-1 text-xs";
const labelTextClass = "text-zinc-500 dark:text-zinc-400";

export function NewTemplateForm({
  templates,
}: {
  templates: { id: string; name: string; siteType: string }[];
}) {
  const [source, setSource] = useState<SourceOption>("blank");
  const [state, formAction, pending] = useActionState<
    TemplateFormState,
    FormData
  >(createTemplateAction, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="source" value={source} />

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelTextClass} mb-2 text-xs`}>
          How do you want to start?
        </legend>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSource(option.key)}
              className={
                source === option.key
                  ? "bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium"
                  : "rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {SOURCES.find((o) => o.key === source)?.hint}
        </p>
      </fieldset>

      {source === "import" ? (
        <label className={labelClass}>
          <span className={labelTextClass}>Template JSON</span>
          <textarea
            name="json"
            rows={16}
            required
            placeholder='{ "name": "...", "slug": "...", "category": "...", "siteType": "ecommerce", "blocks": [] }'
            className={`${fieldClass} font-mono`}
          />
          <span className={labelTextClass}>
            Name, slug, category and siteType come from the file. Blocks are
            re-validated on import — unknown blocks are dropped.
          </span>
        </label>
      ) : (
        <>
          {source === "duplicate" && (
            <label className={labelClass}>
              <span className={labelTextClass}>Copy blocks from</span>
              <select
                name="sourceTemplateId"
                required
                defaultValue=""
                className={fieldClass}
              >
                <option value="" disabled>
                  Select a template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.siteType})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={labelClass}>
            <span className={labelTextClass}>Name</span>
            <input name="name" required maxLength={200} className={fieldClass} />
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>Slug (optional)</span>
            <input
              name="slug"
              maxLength={80}
              placeholder="derived from the name if left empty"
              className={fieldClass}
            />
            <span className={labelTextClass}>
              Lowercase letters, numbers and hyphens. A number is appended if the
              slug is already taken.
            </span>
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>Category</span>
            <input
              name="category"
              required
              maxLength={100}
              placeholder="e.g. fashion, grocery, agency"
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>Site type</span>
            <select name="siteType" defaultValue="ecommerce" className={fieldClass}>
              {SITE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create and edit"}
        </button>
        <Link href="/admin/templates" className="text-sm underline">
          Cancel
        </Link>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        New templates are created inactive — activate them from the template list
        once you are happy with the layout.
      </p>
    </form>
  );
}
