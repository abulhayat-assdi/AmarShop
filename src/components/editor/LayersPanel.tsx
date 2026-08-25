"use client";

import { useState } from "react";
import type { ElementNode } from "@/lib/elements/tree";
import { isContainer } from "@/lib/elements/widgets";

/**
 * The layer tree (spec §5.7) — Elementor's Navigator.
 *
 * Drag a row onto another to re-order or re-nest: dropping on the upper or
 * lower edge places the element before or after the target, dropping in the
 * middle of a container puts it inside. This is the precise counterpart to
 * dragging on the canvas, and it is the only way to reach deeply nested spots
 * reliably.
 */
type DropPosition = "before" | "after" | "inside";

function labelFor(node: ElementNode): string {
  const text = node.props.text;
  if (typeof text === "string" && text.trim()) {
    return `${node.type} · ${text.trim().slice(0, 24)}`;
  }
  return node.type;
}

export function LayersPanel({
  tree,
  selectedId,
  onSelect,
  onMove,
}: {
  tree: ElementNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, targetId: string, position: DropPosition) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{
    id: string;
    position: DropPosition;
  } | null>(null);

  function positionFromEvent(
    event: React.DragEvent,
    node: ElementNode,
  ): DropPosition {
    const box = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientY - box.top) / box.height;
    if (isContainer(node.type)) {
      if (offset < 0.25) return "before";
      if (offset > 0.75) return "after";
      return "inside";
    }
    return offset < 0.5 ? "before" : "after";
  }

  function renderRow(node: ElementNode, depth: number) {
    const selected = node.id === selectedId;
    const hint = dropHint?.id === node.id ? dropHint.position : null;

    return (
      <li key={node.id}>
        <div
          draggable
          onDragStart={(event) => {
            setDragId(node.id);
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            setDragId(null);
            setDropHint(null);
          }}
          onDragOver={(event) => {
            if (!dragId || dragId === node.id) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropHint({
              id: node.id,
              position: positionFromEvent(event, node),
            });
          }}
          onDragLeave={() => setDropHint(null)}
          onDrop={(event) => {
            event.preventDefault();
            const position = positionFromEvent(event, node);
            if (dragId && dragId !== node.id) onMove(dragId, node.id, position);
            setDragId(null);
            setDropHint(null);
          }}
          onClick={() => onSelect(node.id)}
          role="treeitem"
          aria-selected={selected}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(node.id);
            }
          }}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          className={[
            "flex cursor-grab items-center gap-2 rounded py-1.5 pr-2 text-xs",
            selected
              ? "bg-foreground text-background"
              : "hover:bg-black/5 dark:hover:bg-white/10",
            hint === "before" && "border-t-2 border-t-sky-500",
            hint === "after" && "border-b-2 border-b-sky-500",
            hint === "inside" && "ring-2 ring-sky-500 ring-inset",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="opacity-50">
            {isContainer(node.type) ? "▸" : "•"}
          </span>
          <span className="truncate">{labelFor(node)}</span>
        </div>
        {node.children && node.children.length > 0 && (
          <ul>{node.children.map((child) => renderRow(child, depth + 1))}</ul>
        )}
      </li>
    );
  }

  if (tree.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
        Nothing on the page yet — add a Section from the panel on the left.
      </p>
    );
  }

  return (
    <ul role="tree" aria-label="Page layers" className="px-2 py-2">
      {tree.map((node) => renderRow(node, 0))}
    </ul>
  );
}
