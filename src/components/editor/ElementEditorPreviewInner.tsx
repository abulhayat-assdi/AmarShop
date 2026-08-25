"use client";

import { useState } from "react";
import { ElementEditor } from "./ElementEditor";

/**
 * Runs the element editor against browser-held state (spec §5.7).
 *
 * Until the element system replaces the stored block format, "Publish" keeps the
 * tree in localStorage so a session survives a reload — enough to evaluate the
 * editor without touching a live site.
 */
const STORAGE_KEY = "amarshop.element-editor.preview";

const STARTER = [
  {
    id: "sec-hero",
    type: "Section",
    props: { contentWidth: "boxed", stackOn: "mobile", htmlTag: "header" },
    style: {
      padding: { base: { top: 80, right: 24, bottom: 80, left: 24 } },
      backgroundColor: { base: "#0f172a" },
      color: { base: "#f8fafc" },
      align: { base: "center" },
    },
    children: [
      {
        id: "col-hero",
        type: "Column",
        props: {},
        style: {},
        children: [
          {
            id: "head-hero",
            type: "Heading",
            props: { text: "আপনার দোকান, আপনার মতো", level: "h1" },
            style: {
              fontSize: { base: 48, mobile: 30 },
              fontWeight: { base: 700 },
              lineHeight: { base: 1.2 },
            },
          },
          {
            id: "text-hero",
            type: "Text",
            props: { text: "যেকোনো সেকশন সাজান — টেনে এনে, ক্লিক করে।" },
            style: {
              fontSize: { base: 18, mobile: 15 },
              opacity: { base: 0.85 },
              margin: { base: { top: 12 } },
            },
          },
          {
            id: "sp-hero",
            type: "Spacer",
            props: { height: { base: 28, mobile: 18 } },
            style: {},
          },
          {
            id: "btn-hero",
            type: "Button",
            props: { text: "শপে যান", href: "/shop", size: "lg", icon: "cart" },
            style: {
              backgroundColor: { base: "#38bdf8" },
              color: { base: "#0b1220" },
              borderRadius: {
                base: {
                  topLeft: 8,
                  topRight: 8,
                  bottomRight: 8,
                  bottomLeft: 8,
                },
              },
              width: { base: "fit" },
            },
          },
        ],
      },
    ],
  },
];

export function ElementEditorPreviewInner() {
  // This component never renders on the server (it is loaded with ssr:false),
  // so localStorage can be read while seeding state.
  const [initialTree] = useState<unknown>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : STARTER;
    } catch {
      return STARTER;
    }
  });

  async function save(tree: unknown) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
    } catch {
      throw new Error("Could not save the preview locally.");
    }
  }

  return (
    <ElementEditor
      initialTree={initialTree}
      onSave={save}
      exitHref="/dashboard"
      exitLabel="Exit preview"
    />
  );
}
