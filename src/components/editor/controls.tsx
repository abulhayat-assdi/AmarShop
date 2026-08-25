"use client";

import type { ReactNode } from "react";
import type { Breakpoint } from "@/lib/elements/responsive";

/**
 * Form controls for the element editor's inspector (spec §5.7).
 *
 * Style controls are breakpoint-aware: they show the value in effect at the
 * current breakpoint and mark whether it is set here or inherited from a wider
 * one, the way Elementor's responsive switcher behaves. Clearing a control
 * removes the override rather than writing an empty value.
 */
export const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function Field({
  label,
  hint,
  inherited,
  onClear,
  children,
}: {
  label: string;
  hint?: string;
  inherited?: boolean;
  onClear?: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        {label}
        {inherited && (
          <span
            title="Inherited from a wider breakpoint"
            className="rounded bg-black/5 px-1 text-[10px] dark:bg-white/10"
          >
            inherited
          </span>
        )}
        {onClear && !inherited && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-[10px] underline opacity-60 hover:opacity-100"
          >
            clear
          </button>
        )}
      </span>
      {children}
      {hint && <span className="text-[10px] text-zinc-400">{hint}</span>}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        rows={4}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(event) =>
        onChange(
          event.target.value === "" ? undefined : Number(event.target.value),
        )
      }
      className={inputClass}
    />
  );
}

export function SelectInput<T extends string>({
  value,
  options,
  onChange,
  allowEmpty,
}: {
  value: T | undefined;
  options: readonly T[];
  onChange: (value: T | undefined) => void;
  allowEmpty?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(event) =>
        onChange(
          event.target.value === "" ? undefined : (event.target.value as T),
        )
      }
      className={inputClass}
    >
      {(allowEmpty || value === undefined) && <option value="">—</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function ColorInput({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#000000"}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-10 shrink-0 cursor-pointer rounded border border-black/15 bg-transparent dark:border-white/20"
      />
      <input
        type="text"
        value={value ?? ""}
        placeholder="#000000"
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : event.target.value)
        }
        className={inputClass}
      />
    </div>
  );
}

export function CheckboxInput({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

/** Four linked number inputs — padding, margin, border width, radius. */
export function SidesInput({
  value,
  keys,
  labels,
  min,
  max,
  onChange,
}: {
  value: Record<string, number | undefined> | undefined;
  keys: readonly string[];
  labels: readonly string[];
  min: number;
  max: number;
  onChange: (value: Record<string, number | undefined> | undefined) => void;
}) {
  function set(key: string, next: number | undefined) {
    const merged = { ...(value ?? {}), [key]: next };
    for (const k of Object.keys(merged)) {
      if (merged[k] === undefined) delete merged[k];
    }
    onChange(Object.keys(merged).length === 0 ? undefined : merged);
  }

  return (
    <div className="grid grid-cols-4 gap-1">
      {keys.map((key, index) => (
        <div key={key} className="flex flex-col gap-0.5">
          <input
            type="number"
            min={min}
            max={max}
            value={value?.[key] ?? ""}
            onChange={(event) =>
              set(
                key,
                event.target.value === ""
                  ? undefined
                  : Number(event.target.value),
              )
            }
            className="w-full rounded-md border border-black/15 bg-transparent px-1.5 py-1 text-center text-xs outline-none focus:border-black/40 dark:border-white/20"
          />
          <span className="text-center text-[10px] text-zinc-400">
            {labels[index]}
          </span>
        </div>
      ))}
    </div>
  );
}

const BREAKPOINT_LABEL: Record<Breakpoint, string> = {
  base: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

export function BreakpointSwitcher({
  value,
  onChange,
}: {
  value: Breakpoint;
  onChange: (breakpoint: Breakpoint) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-black/10 p-0.5 dark:border-white/15">
      {(["base", "tablet", "mobile"] as const).map((breakpoint) => (
        <button
          key={breakpoint}
          type="button"
          onClick={() => onChange(breakpoint)}
          aria-pressed={value === breakpoint}
          className={
            value === breakpoint
              ? "bg-foreground text-background rounded px-2.5 py-1 text-xs font-medium"
              : "rounded px-2.5 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
          }
        >
          {BREAKPOINT_LABEL[breakpoint]}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-black/5 px-4 py-4 last:border-b-0 dark:border-white/10">
      <h3 className="text-[11px] font-semibold tracking-wide uppercase opacity-60">
        {title}
      </h3>
      {children}
    </section>
  );
}
