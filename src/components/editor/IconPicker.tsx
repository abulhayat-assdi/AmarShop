"use client";

import { ElementIcon } from "@/components/elements/ElementIcon";
import { ICON_NAMES, type IconName } from "@/lib/elements/widgets";

/**
 * Visual icon picker (spec §5.7). A dropdown of icon names tells a shop owner
 * nothing — showing the icons is the whole point. `allowNone` is used where an
 * icon is optional, such as a button's leading icon.
 */
export function IconPicker({
  value,
  onChange,
  allowNone,
}: {
  value: IconName | undefined;
  onChange: (value: IconName | undefined) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {allowNone && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title="No icon"
          aria-pressed={value === undefined}
          className={
            value === undefined
              ? "flex aspect-square items-center justify-center rounded border-2 border-sky-500 text-[10px]"
              : "flex aspect-square items-center justify-center rounded border border-black/10 text-[10px] hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          }
        >
          none
        </button>
      )}
      {ICON_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          aria-label={name}
          aria-pressed={value === name}
          className={
            value === name
              ? "flex aspect-square items-center justify-center rounded border-2 border-sky-500"
              : "flex aspect-square items-center justify-center rounded border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          }
        >
          <ElementIcon name={name} size={18} />
        </button>
      ))}
    </div>
  );
}
