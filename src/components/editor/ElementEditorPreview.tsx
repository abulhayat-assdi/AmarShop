"use client";

import dynamic from "next/dynamic";

/**
 * Loads the preview editor without server rendering, so it can seed its state
 * from localStorage during the first render instead of after mounting.
 */
const Inner = dynamic(
  () =>
    import("./ElementEditorPreviewInner").then(
      (module) => module.ElementEditorPreviewInner,
    ),
  { ssr: false },
);

export function ElementEditorPreview() {
  return <Inner />;
}
