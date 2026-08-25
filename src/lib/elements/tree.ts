import { type ElementStyle, parseStyle } from "./style";
import {
  isContainer,
  isWidgetType,
  parseWidgetProps,
  type WidgetType,
} from "./widgets";

/**
 * The element tree (spec §5.3, §5.7).
 *
 * A site is a list of root elements; containers carry `children`, so a page is
 * Section → Column → widgets, exactly like Elementor's structure. Ids are stable
 * and unique across the tree: the editor selects by id, the AI addresses edits
 * by id, and the generated CSS keys its classes off them.
 *
 * `parseTree` is the authoritative gate every write goes through (editor, AI,
 * template import). It drops unknown types, re-validates props and style, and
 * repairs duplicate or malformed ids rather than throwing, so one bad element
 * never breaks a page.
 */
export type ElementNode = {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
  style: ElementStyle;
  children?: ElementNode[];
};

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Ids are restricted so they can be used verbatim in a CSS class name. */
export function isValidElementId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

let counter = 0;

/** A short unique id. Deterministic enough for tests via the counter suffix. */
export function createElementId(type: WidgetType): string {
  counter = (counter + 1) % 1_000_000;
  const random = Math.random().toString(36).slice(2, 8);
  return `${type.toLowerCase()}-${random}${counter.toString(36)}`;
}

type ParseContext = { seen: Set<string> };

function parseNode(raw: unknown, ctx: ParseContext): ElementNode | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  if (!isWidgetType(source.type)) return null;
  const type = source.type;

  // Keep the author's id when it is usable and unclaimed; otherwise mint one so
  // styles and AI edits still address this element unambiguously.
  let id = isValidElementId(source.id) ? source.id : createElementId(type);
  while (ctx.seen.has(id)) id = createElementId(type);
  ctx.seen.add(id);

  const node: ElementNode = {
    id,
    type,
    props: parseWidgetProps(type, source.props),
    style: parseStyle(source.style),
  };

  if (isContainer(type)) {
    const children = Array.isArray(source.children) ? source.children : [];
    node.children = children
      .map((child) => parseNode(child, ctx))
      .filter((child): child is ElementNode => child !== null);
  }

  return node;
}

/** Parses an unknown value into a valid element tree. Never throws. */
export function parseTree(raw: unknown): ElementNode[] {
  if (!Array.isArray(raw)) return [];
  const ctx: ParseContext = { seen: new Set() };
  return raw
    .map((node) => parseNode(node, ctx))
    .filter((node): node is ElementNode => node !== null);
}

/** Depth-first walk over every node in the tree. */
export function* walkTree(
  nodes: ElementNode[],
): Generator<{ node: ElementNode; parent: ElementNode | null; index: number }> {
  function* visit(
    list: ElementNode[],
    parent: ElementNode | null,
  ): Generator<{
    node: ElementNode;
    parent: ElementNode | null;
    index: number;
  }> {
    for (let index = 0; index < list.length; index += 1) {
      const node = list[index];
      yield { node, parent, index };
      if (node.children) yield* visit(node.children, node);
    }
  }
  yield* visit(nodes, null);
}

export function findNode(nodes: ElementNode[], id: string): ElementNode | null {
  for (const { node } of walkTree(nodes)) {
    if (node.id === id) return node;
  }
  return null;
}

/** Every node's id and style — the input `buildStylesheet` expects. */
export function collectStyles(
  nodes: ElementNode[],
): { id: string; style: ElementStyle }[] {
  const entries: { id: string; style: ElementStyle }[] = [];
  for (const { node } of walkTree(nodes)) {
    entries.push({ id: node.id, style: node.style });
  }
  return entries;
}

function cloneList(nodes: ElementNode[]): ElementNode[] {
  return nodes.map((node) => ({
    ...node,
    props: { ...node.props },
    style: { ...node.style },
    ...(node.children ? { children: cloneList(node.children) } : {}),
  }));
}

/** Replaces one node in a copy of the tree; returns null when the id is absent. */
export function updateNode(
  nodes: ElementNode[],
  id: string,
  update: (node: ElementNode) => ElementNode,
): ElementNode[] | null {
  let found = false;
  function map(list: ElementNode[]): ElementNode[] {
    return list.map((node) => {
      if (node.id === id) {
        found = true;
        return update(node);
      }
      return node.children ? { ...node, children: map(node.children) } : node;
    });
  }
  const next = map(cloneList(nodes));
  return found ? next : null;
}

/** Removes a node by id; returns null when the id is absent. */
export function removeNode(
  nodes: ElementNode[],
  id: string,
): ElementNode[] | null {
  let found = false;
  function filter(list: ElementNode[]): ElementNode[] {
    return list
      .filter((node) => {
        if (node.id === id) {
          found = true;
          return false;
        }
        return true;
      })
      .map((node) =>
        node.children ? { ...node, children: filter(node.children) } : node,
      );
  }
  const next = filter(cloneList(nodes));
  return found ? next : null;
}

/**
 * Inserts nodes into a parent (or the root when `parentId` is null) at `index`,
 * clamped to the parent's length. Returns null when the parent is missing or is
 * not a container.
 */
export function insertNodes(
  nodes: ElementNode[],
  parentId: string | null,
  index: number,
  inserted: ElementNode[],
): ElementNode[] | null {
  const next = cloneList(nodes);
  if (parentId === null) {
    const at = Math.max(0, Math.min(index, next.length));
    next.splice(at, 0, ...cloneList(inserted));
    return next;
  }

  const parent = findNode(next, parentId);
  if (!parent || !isContainer(parent.type)) return null;
  parent.children = parent.children ?? [];
  const at = Math.max(0, Math.min(index, parent.children.length));
  parent.children.splice(at, 0, ...cloneList(inserted));
  return next;
}

/** Moves an existing node to a new parent/index. */
export function moveNode(
  nodes: ElementNode[],
  id: string,
  parentId: string | null,
  index: number,
): ElementNode[] | null {
  const node = findNode(nodes, id);
  if (!node) return null;
  // Refuse to move a container inside itself — that would detach the subtree.
  if (parentId !== null && (parentId === id || findNode([node], parentId))) {
    return null;
  }
  const without = removeNode(nodes, id);
  if (!without) return null;
  return insertNodes(without, parentId, index, [node]);
}
