"use client";

import {
  PALETTE_TYPES,
  WIDGETS,
  type WidgetType,
} from "@/lib/elements/widgets";

/**
 * The widget palette (spec §5.7) — Elementor's ELEMENTS panel.
 *
 * A widget can be dragged onto the canvas (dropping it on an element places it
 * relative to that element) or simply clicked, which adds it next to whatever is
 * selected. Clicking matters: dragging is awkward on touch devices, and many
 * shop owners will be on a tablet.
 */
const GLYPH: Record<WidgetType, string> = {
  Section: "▤",
  Column: "▥",
  Heading: "H",
  Text: "¶",
  Image: "🖼",
  Button: "▭",
  Divider: "—",
  Spacer: "↕",
  Icon: "★",
  Shape: "◆",
  Video: "▶",
};

export function WidgetPalette({
  onAdd,
  onDragStart,
}: {
  onAdd: (widget: WidgetType) => void;
  onDragStart: (widget: WidgetType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {PALETTE_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          draggable
          onDragStart={(event) => {
            onDragStart(type);
            event.dataTransfer.effectAllowed = "copy";
            event.dataTransfer.setData("text/plain", type);
          }}
          onClick={() => onAdd(type)}
          title={`Add ${WIDGETS[type].label}`}
          className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-black/10 px-2 py-3 text-xs hover:border-black/25 hover:bg-black/5 dark:border-white/15 dark:hover:border-white/35 dark:hover:bg-white/10"
        >
          <span aria-hidden="true" className="text-lg leading-none opacity-70">
            {GLYPH[type]}
          </span>
          {WIDGETS[type].label}
        </button>
      ))}
    </div>
  );
}
