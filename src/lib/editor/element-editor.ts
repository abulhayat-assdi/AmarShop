import type { Breakpoint } from "@/lib/elements/responsive";
import type { ElementStyle } from "@/lib/elements/style";
import {
  createElementId,
  type ElementNode,
  findNode,
  insertNodes,
  moveNode,
  parseTree,
  removeNode,
  updateNode,
  walkTree,
} from "@/lib/elements/tree";
import {
  isContainer,
  parseWidgetProps,
  type WidgetType,
} from "@/lib/elements/widgets";

/**
 * Editor state for the element canvas (spec §5.7).
 *
 * A pure reducer over the element tree: every mutation goes through the tree
 * operations, so the editor, the AI assistant and any future automation all
 * change a site the same way. History is kept as whole-tree snapshots — trees
 * are small (a page, not a document) and it makes undo/redo exact.
 *
 * Keeping this free of React means the interesting behaviour (insertion rules,
 * selection after delete, responsive style edits) is unit-testable.
 */
const HISTORY_LIMIT = 50;

export type EditorState = {
  tree: ElementNode[];
  selectedId: string | null;
  breakpoint: Breakpoint;
  past: ElementNode[][];
  future: ElementNode[][];
};

export type InsertPosition = "before" | "after" | "inside";

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "setBreakpoint"; breakpoint: Breakpoint }
  | {
      type: "add";
      widget: WidgetType;
      targetId?: string | null;
      position?: InsertPosition;
    }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "move"; id: string; parentId: string | null; index: number }
  | { type: "nudge"; id: string; direction: "up" | "down" }
  | { type: "updateProps"; id: string; props: Record<string, unknown> }
  | {
      type: "updateStyle";
      id: string;
      key: keyof ElementStyle;
      breakpoint: Breakpoint;
      value: unknown;
    }
  | { type: "replaceTree"; tree: unknown; selectedId?: string | null }
  | { type: "undo" }
  | { type: "redo" };

/** A new element with sensible starting content — Sections come with a Column. */
export function createDefaultNode(widget: WidgetType): ElementNode {
  const node: ElementNode = {
    id: createElementId(widget),
    type: widget,
    props: parseWidgetProps(widget, {}),
    style: {},
  };

  if (widget === "Section") {
    node.children = [
      {
        id: createElementId("Column"),
        type: "Column",
        props: parseWidgetProps("Column", {}),
        style: {},
      },
    ];
    node.style = {
      padding: { base: { top: 48, right: 24, bottom: 48, left: 24 } },
    };
  } else if (isContainer(widget)) {
    node.children = [];
  }

  return node;
}

/** The parent of `id`, or null when it sits at the root. */
export function findParent(
  tree: ElementNode[],
  id: string,
): ElementNode | null {
  for (const { node, parent } of walkTree(tree)) {
    if (node.id === id) return parent;
  }
  return null;
}

/** The index of `id` inside its parent (or the root list). */
export function indexOf(tree: ElementNode[], id: string): number {
  for (const { node, index } of walkTree(tree)) {
    if (node.id === id) return index;
  }
  return -1;
}

/**
 * Where a newly added widget should land.
 *
 * Dropping "inside" a container appends to it. Otherwise the widget goes next
 * to the target within the target's parent. With nothing selected it appends to
 * the end of the page — and a bare widget with no Section around it is wrapped
 * in one, so the canvas never ends up with loose widgets at the root.
 */
function resolveInsertion(
  tree: ElementNode[],
  targetId: string | null | undefined,
  position: InsertPosition,
): { parentId: string | null; index: number } {
  if (!targetId) return { parentId: null, index: tree.length };

  const target = findNode(tree, targetId);
  if (!target) return { parentId: null, index: tree.length };

  if (position === "inside" && isContainer(target.type)) {
    return { parentId: target.id, index: target.children?.length ?? 0 };
  }

  const parent = findParent(tree, targetId);
  const siblings = parent ? (parent.children ?? []) : tree;
  const at = siblings.findIndex((node) => node.id === targetId);
  const index = position === "before" ? at : at + 1;
  return { parentId: parent ? parent.id : null, index };
}

/** Wraps a loose widget in Section > Column so the root only holds Sections. */
function wrapForRoot(node: ElementNode): ElementNode {
  if (node.type === "Section") return node;
  const section = createDefaultNode("Section");
  section.children = [{ ...section.children![0], children: [node] }];
  return section;
}

/** A deep copy with fresh ids, for duplicate/paste. */
function withNewIds(node: ElementNode): ElementNode {
  return {
    ...node,
    id: createElementId(node.type),
    props: { ...node.props },
    style: { ...node.style },
    ...(node.children
      ? { children: node.children.map((child) => withNewIds(child)) }
      : {}),
  };
}

function commit(
  state: EditorState,
  tree: ElementNode[],
  selectedId: string | null = state.selectedId,
): EditorState {
  return {
    ...state,
    tree,
    selectedId,
    past: [...state.past, state.tree].slice(-HISTORY_LIMIT),
    future: [],
  };
}

/** The element selected after `id` is removed — its neighbour, else its parent. */
function selectionAfterRemoval(state: EditorState, id: string): string | null {
  if (state.selectedId !== id) return state.selectedId;
  const parent = findParent(state.tree, id);
  const siblings = parent ? (parent.children ?? []) : state.tree;
  const at = siblings.findIndex((node) => node.id === id);
  const neighbour = siblings[at + 1] ?? siblings[at - 1];
  return neighbour ? neighbour.id : (parent?.id ?? null);
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: action.id };

    case "setBreakpoint":
      return { ...state, breakpoint: action.breakpoint };

    case "add": {
      const position = action.position ?? "after";
      const { parentId, index } = resolveInsertion(
        state.tree,
        action.targetId,
        position,
      );
      let node = createDefaultNode(action.widget);
      if (parentId === null) node = wrapForRoot(node);
      const next = insertNodes(state.tree, parentId, index, [node]);
      return next ? commit(state, next, node.id) : state;
    }

    case "remove": {
      const selectedId = selectionAfterRemoval(state, action.id);
      const next = removeNode(state.tree, action.id);
      return next ? commit(state, next, selectedId) : state;
    }

    case "duplicate": {
      const node = findNode(state.tree, action.id);
      if (!node) return state;
      const parent = findParent(state.tree, action.id);
      const copy = withNewIds(node);
      const next = insertNodes(
        state.tree,
        parent ? parent.id : null,
        indexOf(state.tree, action.id) + 1,
        [copy],
      );
      return next ? commit(state, next, copy.id) : state;
    }

    case "move": {
      const next = moveNode(
        state.tree,
        action.id,
        action.parentId,
        action.index,
      );
      return next ? commit(state, next) : state;
    }

    case "nudge": {
      const parent = findParent(state.tree, action.id);
      const at = indexOf(state.tree, action.id);
      if (at < 0) return state;
      const siblings = parent ? (parent.children ?? []) : state.tree;
      const to = action.direction === "up" ? at - 1 : at + 1;
      if (to < 0 || to >= siblings.length) return state;
      const next = moveNode(
        state.tree,
        action.id,
        parent ? parent.id : null,
        to,
      );
      return next ? commit(state, next) : state;
    }

    case "updateProps": {
      const node = findNode(state.tree, action.id);
      if (!node) return state;
      const props = parseWidgetProps(node.type, {
        ...node.props,
        ...action.props,
      });
      const next = updateNode(state.tree, action.id, (current) => ({
        ...current,
        props,
      }));
      return next ? commit(state, next) : state;
    }

    case "updateStyle": {
      const next = updateNode(state.tree, action.id, (current) => {
        const existing = (current.style[action.key] ?? {}) as Record<
          string,
          unknown
        >;
        const merged = { ...existing };
        // An empty value clears the override for this breakpoint, letting the
        // wider breakpoint's value show through again.
        if (action.value === undefined || action.value === "") {
          delete merged[action.breakpoint];
        } else {
          merged[action.breakpoint] = action.value;
        }

        const style = { ...current.style };
        if (Object.keys(merged).length === 0) {
          delete style[action.key];
        } else {
          (style as Record<string, unknown>)[action.key] = merged;
        }
        return { ...current, style };
      });
      if (!next) return state;
      // Re-validate so an out-of-range or malformed value can never be stored.
      return commit(state, parseTree(next));
    }

    case "replaceTree": {
      const tree = parseTree(action.tree);
      const selectedId =
        action.selectedId !== undefined
          ? action.selectedId
          : state.selectedId && findNode(tree, state.selectedId)
            ? state.selectedId
            : null;
      return commit(state, tree, selectedId);
    }

    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        tree: previous,
        past: state.past.slice(0, -1),
        future: [state.tree, ...state.future].slice(0, HISTORY_LIMIT),
        selectedId:
          state.selectedId && findNode(previous, state.selectedId)
            ? state.selectedId
            : null,
      };
    }

    case "redo": {
      const [nextTree, ...rest] = state.future;
      if (!nextTree) return state;
      return {
        ...state,
        tree: nextTree,
        past: [...state.past, state.tree].slice(-HISTORY_LIMIT),
        future: rest,
        selectedId:
          state.selectedId && findNode(nextTree, state.selectedId)
            ? state.selectedId
            : null,
      };
    }
  }
}

export function createEditorState(tree: unknown): EditorState {
  return {
    tree: parseTree(tree),
    selectedId: null,
    breakpoint: "base",
    past: [],
    future: [],
  };
}
