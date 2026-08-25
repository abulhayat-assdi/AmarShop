"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer, useState } from "react";
import {
  createEditorState,
  editorReducer,
  findParent,
  indexOf,
} from "@/lib/editor/element-editor";
import type { ElementStyle } from "@/lib/elements/style";
import { findNode } from "@/lib/elements/tree";
import { isContainer, type WidgetType } from "@/lib/elements/widgets";
import { ContentPanel } from "./ContentPanel";
import { BreakpointSwitcher } from "./controls";
import { EditorCanvas } from "./EditorCanvas";
import { LayersPanel } from "./LayersPanel";
import { StylePanel } from "./StylePanel";
import { WidgetPalette } from "./WidgetPalette";

/**
 * The element editor (spec §5.7) — the Elementor-style editing surface.
 *
 * Three columns: the widget palette and layer tree on the left, the live canvas
 * in the middle, the Content/Style inspector on the right. All state lives in
 * the pure reducer, so the AI assistant (next step) drives exactly the same
 * operations the UI does.
 *
 * Nothing is persisted until Publish — the same contract as the rest of the
 * editor, so experimenting is safe.
 */
type LeftTab = "widgets" | "layers";
type RightTab = "content" | "style";

const tabClass = (active: boolean) =>
  active
    ? "flex-1 border-b-2 border-b-sky-500 px-3 py-2 text-xs font-medium"
    : "flex-1 border-b-2 border-b-transparent px-3 py-2 text-xs opacity-60 hover:opacity-100";

export function ElementEditor({
  initialTree,
  onSave,
  exitHref = "/dashboard",
  exitLabel = "Exit",
}: {
  initialTree: unknown;
  onSave: (tree: unknown) => Promise<void>;
  exitHref?: string;
  exitLabel?: string;
}) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialTree,
    createEditorState,
  );
  const [leftTab, setLeftTab] = useState<LeftTab>("widgets");
  const [rightTab, setRightTab] = useState<RightTab>("content");
  const [status, setStatus] = useState<string | null>(null);
  const [dragWidget, setDragWidget] = useState<WidgetType | null>(null);

  const selected = state.selectedId
    ? findNode(state.tree, state.selectedId)
    : null;

  const publish = useCallback(async () => {
    setStatus("Saving…");
    try {
      await onSave(state.tree);
      setStatus("Saved");
    } catch {
      setStatus("Save failed");
    }
  }, [onSave, state.tree]);

  // Keyboard shortcuts mirroring what people expect from a design tool.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void publish();
        return;
      }
      if (typing || !state.selectedId) return;
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        dispatch({ type: "duplicate", id: state.selectedId });
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        dispatch({ type: "remove", id: state.selectedId });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [publish, state.selectedId]);

  /** A widget dropped on the canvas lands inside containers, beside widgets. */
  function handleDropWidget(targetId: string | null) {
    if (!dragWidget) return;
    const target = targetId ? findNode(state.tree, targetId) : null;
    dispatch({
      type: "add",
      widget: dragWidget,
      targetId,
      position: target && isContainer(target.type) ? "inside" : "after",
    });
    setDragWidget(null);
  }

  /** Layer-tree drags map onto a parent + index for the move operation. */
  function handleLayerMove(
    id: string,
    targetId: string,
    position: "before" | "after" | "inside",
  ) {
    if (position === "inside") {
      const target = findNode(state.tree, targetId);
      dispatch({
        type: "move",
        id,
        parentId: targetId,
        index: target?.children?.length ?? 0,
      });
      return;
    }
    const parent = findParent(state.tree, targetId);
    const at = indexOf(state.tree, targetId);
    dispatch({
      type: "move",
      id,
      parentId: parent ? parent.id : null,
      index: position === "before" ? at : at + 1,
    });
  }

  const selectedToolbar = selected ? (
    <div className="pointer-events-auto sticky bottom-3 z-10 mx-auto flex w-fit items-center gap-1 rounded-full border border-black/10 bg-white/95 px-2 py-1 text-xs shadow-lg backdrop-blur dark:border-white/20 dark:bg-zinc-900/95">
      <span className="px-2 font-medium">{selected.type}</span>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "nudge", id: selected.id, direction: "up" })
        }
        title="Move up"
        className="rounded px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
      >
        &uarr;
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "nudge", id: selected.id, direction: "down" })
        }
        title="Move down"
        className="rounded px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
      >
        &darr;
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "duplicate", id: selected.id })}
        title="Duplicate (Ctrl+D)"
        className="rounded px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "remove", id: selected.id })}
        title="Delete (Del)"
        className="rounded px-2 py-1 text-red-600 hover:bg-red-500/10 dark:text-red-400"
      >
        Delete
      </button>
    </div>
  ) : null;

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col">
      <header className="flex items-center gap-3 border-b border-black/10 px-4 py-2 dark:border-white/15">
        <Link href={exitHref} className="text-sm underline">
          {exitLabel}
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <BreakpointSwitcher
            value={state.breakpoint}
            onChange={(breakpoint) =>
              dispatch({ type: "setBreakpoint", breakpoint })
            }
          />
          <button
            type="button"
            onClick={() => dispatch({ type: "undo" })}
            disabled={state.past.length === 0}
            title="Undo (Ctrl+Z)"
            className="rounded-md border border-black/15 px-2.5 py-1.5 text-sm disabled:opacity-40 dark:border-white/20"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "redo" })}
            disabled={state.future.length === 0}
            title="Redo (Ctrl+Shift+Z)"
            className="rounded-md border border-black/15 px-2.5 py-1.5 text-sm disabled:opacity-40 dark:border-white/20"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={publish}
            className="bg-foreground text-background rounded-md px-4 py-1.5 text-sm font-medium"
          >
            Publish
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-black/10 dark:border-white/15">
          <div className="flex border-b border-black/10 dark:border-white/15">
            <button
              type="button"
              onClick={() => setLeftTab("widgets")}
              className={tabClass(leftTab === "widgets")}
            >
              Widgets
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("layers")}
              className={tabClass(leftTab === "layers")}
            >
              Layers
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {leftTab === "widgets" ? (
              <WidgetPalette
                onAdd={(widget) =>
                  dispatch({
                    type: "add",
                    widget,
                    targetId: state.selectedId,
                    position:
                      selected && isContainer(selected.type)
                        ? "inside"
                        : "after",
                  })
                }
                onDragStart={setDragWidget}
              />
            ) : (
              <LayersPanel
                tree={state.tree}
                selectedId={state.selectedId}
                onSelect={(id) => dispatch({ type: "select", id })}
                onMove={handleLayerMove}
              />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <EditorCanvas
            tree={state.tree}
            selectedId={state.selectedId}
            breakpoint={state.breakpoint}
            onSelect={(id) => dispatch({ type: "select", id })}
            onDropWidget={handleDropWidget}
            toolbar={selectedToolbar}
          />
        </main>

        <aside className="flex w-80 shrink-0 flex-col border-l border-black/10 dark:border-white/15">
          {selected ? (
            <>
              <div className="flex border-b border-black/10 dark:border-white/15">
                <button
                  type="button"
                  onClick={() => setRightTab("content")}
                  className={tabClass(rightTab === "content")}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab("style")}
                  className={tabClass(rightTab === "style")}
                >
                  Style
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                {rightTab === "content" ? (
                  <ContentPanel
                    node={selected}
                    breakpoint={state.breakpoint}
                    onChange={(props) =>
                      dispatch({ type: "updateProps", id: selected.id, props })
                    }
                  />
                ) : (
                  <StylePanel
                    node={selected}
                    breakpoint={state.breakpoint}
                    onChange={(key: keyof ElementStyle, value: unknown) =>
                      dispatch({
                        type: "updateStyle",
                        id: selected.id,
                        key,
                        breakpoint: state.breakpoint,
                        value,
                      })
                    }
                  />
                )}
              </div>
            </>
          ) : (
            <p className="p-4 text-xs text-zinc-500 dark:text-zinc-400">
              Select an element on the canvas to edit its content and style.
            </p>
          )}
        </aside>
      </div>

      {status && (
        <div className="bg-foreground text-background fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-md px-4 py-2 text-sm">
          {status}
        </div>
      )}
    </div>
  );
}
