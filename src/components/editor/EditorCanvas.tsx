"use client";

import { useEffect, useRef, useState } from "react";
import { ElementRenderer } from "@/components/elements/ElementRenderer";
import { elementClassName } from "@/lib/elements/css";
import {
  BREAKPOINT_MAX_WIDTH,
  type Breakpoint,
} from "@/lib/elements/responsive";
import type { ElementNode } from "@/lib/elements/tree";

/**
 * The editing canvas (spec §5.7).
 *
 * The page is drawn by the same ElementRenderer the storefront uses, so what
 * you see is what visitors get. Selection is layered on top: clicks are
 * intercepted (links must not navigate while editing), the element under the
 * cursor is found by walking up to the nearest `.el-<id>` class, and the
 * selected element gets an outline plus a small toolbar.
 *
 * The canvas is width-constrained to the current breakpoint so tablet/mobile
 * overrides can be previewed without resizing the browser.
 */
const CANVAS_WIDTH: Record<Breakpoint, number | null> = {
  base: null,
  tablet: BREAKPOINT_MAX_WIDTH.tablet,
  mobile: 390,
};

/** The id of the nearest element ancestor of an event target. */
function elementIdFrom(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-el-id]")?.dataset.elId ?? null;
}

export function EditorCanvas({
  tree,
  selectedId,
  breakpoint,
  onSelect,
  onDropWidget,
  toolbar,
}: {
  tree: ElementNode[];
  selectedId: string | null;
  breakpoint: Breakpoint;
  onSelect: (id: string | null) => void;
  onDropWidget: (targetId: string | null) => void;
  toolbar: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Outline the hovered and selected elements without touching the rendered
  // markup: a stylesheet keyed off the generated classes does it.
  const overlayCss = [
    hoverId &&
      `.${elementClassName(hoverId)}{outline:1px dashed rgba(14,165,233,.8);outline-offset:-1px}`,
    selectedId &&
      `.${elementClassName(selectedId)}{outline:2px solid rgb(14,165,233);outline-offset:-2px}`,
    dropTargetId &&
      `.${elementClassName(dropTargetId)}{background-color:rgba(14,165,233,.08);outline:2px dashed rgb(14,165,233);outline-offset:-2px}`,
    // Nothing on the canvas should navigate or play while editing.
    ".el-root a{pointer-events:none}.el-root iframe,.el-root video{pointer-events:none}",
  ]
    .filter(Boolean)
    .join("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onSelect(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSelect]);

  const width = CANVAS_WIDTH[breakpoint];

  return (
    <div className="relative flex h-full flex-col overflow-auto bg-zinc-100 p-6 dark:bg-zinc-900">
      <div
        ref={containerRef}
        style={width ? { width: `${width}px` } : undefined}
        className="bg-background relative mx-auto w-full shadow-lg transition-[width] duration-200"
        onClick={(event) => {
          event.preventDefault();
          onSelect(elementIdFrom(event.target));
        }}
        onMouseMove={(event) => setHoverId(elementIdFrom(event.target))}
        onMouseLeave={() => setHoverId(null)}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDropTargetId(elementIdFrom(event.target));
        }}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={(event) => {
          event.preventDefault();
          onDropWidget(elementIdFrom(event.target));
          setDropTargetId(null);
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: overlayCss }} />
        {tree.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <div>
              <p className="mb-1 font-medium">Your page is empty</p>
              <p>
                Drag a widget here, or click one in the panel on the left, to
                get started.
              </p>
            </div>
          </div>
        ) : (
          <ElementRenderer tree={tree} />
        )}
        {toolbar}
      </div>
    </div>
  );
}
