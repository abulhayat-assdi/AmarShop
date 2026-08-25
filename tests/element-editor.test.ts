import { describe, expect, it } from "vitest";
import {
  createDefaultNode,
  createEditorState,
  type EditorAction,
  type EditorState,
  editorReducer,
  findParent,
  indexOf,
} from "@/lib/editor/element-editor";
import { resolveResponsive } from "@/lib/elements/responsive";
import { findNode } from "@/lib/elements/tree";

function run(state: EditorState, ...actions: EditorAction[]): EditorState {
  return actions.reduce(editorReducer, state);
}

const page = () =>
  createEditorState([
    {
      id: "sec-1",
      type: "Section",
      children: [
        {
          id: "col-1",
          type: "Column",
          children: [
            { id: "h-1", type: "Heading", props: { text: "Title" } },
            { id: "t-1", type: "Text", props: { text: "Body" } },
          ],
        },
      ],
    },
  ]);

describe("createDefaultNode", () => {
  it("gives a Section one Column and default padding", () => {
    const section = createDefaultNode("Section");
    expect(section.children).toHaveLength(1);
    expect(section.children![0].type).toBe("Column");
    expect(resolveResponsive(section.style.padding, "base")?.top).toBe(48);
  });

  it("gives leaf widgets their schema defaults and no children", () => {
    const heading = createDefaultNode("Heading");
    expect(heading.props.text).toBe("Heading");
    expect(heading.children).toBeUndefined();
  });
});

describe("add", () => {
  it("inserts after the target within its parent", () => {
    const next = run(page(), { type: "add", widget: "Button", targetId: "h-1" });
    const ids = findNode(next.tree, "col-1")!.children!.map((n) => n.id);
    expect(ids[0]).toBe("h-1");
    expect(ids[2]).toBe("t-1");
    expect(next.selectedId).toBe(ids[1]);
  });

  it("appends inside a container when position is inside", () => {
    const next = run(page(), {
      type: "add",
      widget: "Image",
      targetId: "col-1",
      position: "inside",
    });
    expect(findNode(next.tree, "col-1")!.children).toHaveLength(3);
  });

  it("wraps a loose widget in Section > Column at the root", () => {
    const next = run(createEditorState([]), { type: "add", widget: "Heading" });
    expect(next.tree).toHaveLength(1);
    expect(next.tree[0].type).toBe("Section");
    const column = next.tree[0].children![0];
    expect(column.type).toBe("Column");
    expect(column.children![0].type).toBe("Heading");
  });

  it("does not wrap a Section added at the root", () => {
    const next = run(createEditorState([]), { type: "add", widget: "Section" });
    expect(next.tree[0].type).toBe("Section");
    expect(next.tree[0].children![0].type).toBe("Column");
  });
});

describe("remove", () => {
  it("removes the node and selects a neighbour", () => {
    const next = run(
      page(),
      { type: "select", id: "h-1" },
      { type: "remove", id: "h-1" },
    );
    expect(findNode(next.tree, "h-1")).toBeNull();
    expect(next.selectedId).toBe("t-1");
  });

  it("falls back to the parent when there is no neighbour", () => {
    const next = run(
      page(),
      { type: "remove", id: "t-1" },
      { type: "select", id: "h-1" },
      { type: "remove", id: "h-1" },
    );
    expect(next.selectedId).toBe("col-1");
  });

  it("leaves selection alone when another node is removed", () => {
    const next = run(
      page(),
      { type: "select", id: "t-1" },
      { type: "remove", id: "h-1" },
    );
    expect(next.selectedId).toBe("t-1");
  });
});

describe("duplicate", () => {
  it("copies with fresh ids next to the original", () => {
    const next = run(page(), { type: "duplicate", id: "h-1" });
    const children = findNode(next.tree, "col-1")!.children!;
    expect(children).toHaveLength(3);
    expect(children[1].id).not.toBe("h-1");
    expect(children[1].props.text).toBe("Title");
    expect(next.selectedId).toBe(children[1].id);
  });

  it("gives every descendant a new id", () => {
    const next = run(page(), { type: "duplicate", id: "sec-1" });
    const copy = next.tree[1];
    expect(copy.id).not.toBe("sec-1");
    expect(copy.children![0].id).not.toBe("col-1");
    expect(copy.children![0].children![0].id).not.toBe("h-1");
  });
});

describe("nudge", () => {
  it("swaps with the previous or next sibling", () => {
    const down = run(page(), { type: "nudge", id: "h-1", direction: "down" });
    expect(indexOf(down.tree, "h-1")).toBe(1);
    const up = run(down, { type: "nudge", id: "h-1", direction: "up" });
    expect(indexOf(up.tree, "h-1")).toBe(0);
  });

  it("does nothing at the ends", () => {
    const state = page();
    expect(
      run(state, { type: "nudge", id: "h-1", direction: "up" }).tree,
    ).toEqual(state.tree);
    expect(
      run(state, { type: "nudge", id: "t-1", direction: "down" }).tree,
    ).toEqual(state.tree);
  });
});

describe("updateProps", () => {
  it("merges and re-validates", () => {
    const next = run(page(), {
      type: "updateProps",
      id: "h-1",
      props: { text: "Changed", level: "h1" },
    });
    expect(findNode(next.tree, "h-1")!.props).toMatchObject({
      text: "Changed",
      level: "h1",
    });
  });

  it("rejects an invalid value instead of storing it", () => {
    const next = run(page(), {
      type: "updateProps",
      id: "h-1",
      props: { level: "h9" },
    });
    expect(findNode(next.tree, "h-1")!.props.level).toBe("h2");
  });
});

describe("updateStyle", () => {
  it("sets a value for one breakpoint only", () => {
    const next = run(page(), {
      type: "updateStyle",
      id: "h-1",
      key: "fontSize",
      breakpoint: "mobile",
      value: 20,
    });
    const style = findNode(next.tree, "h-1")!.style;
    expect(style.fontSize).toEqual({ mobile: 20 });
  });

  it("clears the override when the value is emptied", () => {
    const next = run(
      page(),
      { type: "updateStyle", id: "h-1", key: "fontSize", breakpoint: "base", value: 40 },
      { type: "updateStyle", id: "h-1", key: "fontSize", breakpoint: "mobile", value: 20 },
      { type: "updateStyle", id: "h-1", key: "fontSize", breakpoint: "mobile", value: "" },
    );
    expect(findNode(next.tree, "h-1")!.style.fontSize).toEqual({ base: 40 });
  });

  it("drops the property entirely once every breakpoint is cleared", () => {
    const next = run(
      page(),
      { type: "updateStyle", id: "h-1", key: "color", breakpoint: "base", value: "#ff0000" },
      { type: "updateStyle", id: "h-1", key: "color", breakpoint: "base", value: "" },
    );
    expect(findNode(next.tree, "h-1")!.style.color).toBeUndefined();
  });

  it("never stores a value that fails validation", () => {
    const next = run(page(), {
      type: "updateStyle",
      id: "h-1",
      key: "color",
      breakpoint: "base",
      value: "}body{display:none}",
    });
    expect(findNode(next.tree, "h-1")!.style.color).toBeUndefined();
  });
});

describe("history", () => {
  it("undoes and redoes a change", () => {
    const start = page();
    const changed = run(start, {
      type: "updateProps",
      id: "h-1",
      props: { text: "Changed" },
    });
    const undone = run(changed, { type: "undo" });
    expect(findNode(undone.tree, "h-1")!.props.text).toBe("Title");
    const redone = run(undone, { type: "redo" });
    expect(findNode(redone.tree, "h-1")!.props.text).toBe("Changed");
  });

  it("is a no-op with nothing to undo or redo", () => {
    const state = page();
    expect(run(state, { type: "undo" })).toEqual(state);
    expect(run(state, { type: "redo" })).toEqual(state);
  });

  it("clears the redo stack after a new change", () => {
    const next = run(
      page(),
      { type: "remove", id: "t-1" },
      { type: "undo" },
      { type: "remove", id: "h-1" },
    );
    expect(next.future).toHaveLength(0);
  });

  it("drops a selection that no longer exists after undo", () => {
    const next = run(
      page(),
      { type: "add", widget: "Button", targetId: "h-1" },
      { type: "undo" },
    );
    expect(next.selectedId).toBeNull();
  });

  it("does not record selection or breakpoint changes", () => {
    const next = run(
      page(),
      { type: "select", id: "h-1" },
      { type: "setBreakpoint", breakpoint: "mobile" },
    );
    expect(next.past).toHaveLength(0);
    expect(next.breakpoint).toBe("mobile");
  });
});

describe("replaceTree", () => {
  it("swaps the tree and keeps a still-valid selection", () => {
    const next = run(
      page(),
      { type: "select", id: "h-1" },
      {
        type: "replaceTree",
        tree: [
          {
            id: "sec-1",
            type: "Section",
            children: [
              {
                id: "col-1",
                type: "Column",
                children: [{ id: "h-1", type: "Heading", props: { text: "New" } }],
              },
            ],
          },
        ],
      },
    );
    expect(next.selectedId).toBe("h-1");
    expect(findNode(next.tree, "h-1")!.props.text).toBe("New");
    expect(next.past).toHaveLength(1);
  });

  it("clears a selection that is gone", () => {
    const next = run(
      page(),
      { type: "select", id: "h-1" },
      { type: "replaceTree", tree: [] },
    );
    expect(next.selectedId).toBeNull();
  });
});

describe("findParent / indexOf", () => {
  it("locates a node's parent and position", () => {
    const state = page();
    expect(findParent(state.tree, "h-1")?.id).toBe("col-1");
    expect(findParent(state.tree, "sec-1")).toBeNull();
    expect(indexOf(state.tree, "t-1")).toBe(1);
    expect(indexOf(state.tree, "missing")).toBe(-1);
  });
});
