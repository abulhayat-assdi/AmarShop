"use client";

import type { Breakpoint, Responsive } from "@/lib/elements/responsive";
import { resolveResponsive } from "@/lib/elements/responsive";
import type { ElementNode } from "@/lib/elements/tree";
import { type IconName, SHAPES } from "@/lib/elements/widgets";
import {
  CheckboxInput,
  Field,
  NumberInput,
  Section,
  SelectInput,
  TextInput,
} from "./controls";
import { IconPicker } from "./IconPicker";
import { MediaField } from "./MediaField";

/**
 * The Content tab of the inspector (spec §5.7) — each widget's own props.
 *
 * A few props (a Spacer's height, an Icon's size) are responsive like styles
 * are, so they are edited per breakpoint through the same inherit/clear rules.
 */
const HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HTML_TAGS = ["section", "header", "footer", "div", "main"] as const;

export function ContentPanel({
  node,
  breakpoint,
  onChange,
}: {
  node: ElementNode;
  breakpoint: Breakpoint;
  onChange: (props: Record<string, unknown>) => void;
}) {
  function get<T>(key: string, fallback: T): T {
    const value = node.props[key];
    return (value === undefined ? fallback : value) as T;
  }

  function set(key: string, value: unknown) {
    onChange({ [key]: value });
  }

  /** Reads/writes one breakpoint of a responsive prop. */
  function responsiveProp(key: string) {
    const bag = node.props[key] as Responsive<number> | undefined;
    const own = bag?.[breakpoint];
    return {
      value: resolveResponsive(bag, breakpoint),
      inherited:
        own === undefined && resolveResponsive(bag, breakpoint) !== undefined,
      onClear:
        own === undefined
          ? undefined
          : () => {
              const next = { ...(bag ?? {}) };
              delete next[breakpoint];
              set(key, next);
            },
      set: (value: number | undefined) => {
        const next = { ...(bag ?? {}) };
        if (value === undefined) delete next[breakpoint];
        else next[breakpoint] = value;
        set(key, next);
      },
    };
  }

  switch (node.type) {
    case "Section":
      return (
        <Section title="Section">
          <Field label="Content width">
            <SelectInput
              value={get<"boxed" | "full">("contentWidth", "boxed")}
              options={["boxed", "full"] as const}
              onChange={(value) => set("contentWidth", value ?? "boxed")}
            />
          </Field>
          {get<string>("contentWidth", "boxed") === "boxed" && (
            <Field label="Max content width (px)">
              <NumberInput
                value={get<number>("boxedWidth", 1152)}
                min={320}
                max={2400}
                onChange={(value) => set("boxedWidth", value ?? 1152)}
              />
            </Field>
          )}
          <Field
            label="Stack columns"
            hint="Below this width the columns sit above one another."
          >
            <SelectInput
              value={get<"never" | "tablet" | "mobile">("stackOn", "mobile")}
              options={["never", "tablet", "mobile"] as const}
              onChange={(value) => set("stackOn", value ?? "mobile")}
            />
          </Field>
          <Field label="HTML tag" hint="Use header/footer for page landmarks.">
            <SelectInput
              value={get<(typeof HTML_TAGS)[number]>("htmlTag", "section")}
              options={HTML_TAGS}
              onChange={(value) => set("htmlTag", value ?? "section")}
            />
          </Field>
        </Section>
      );

    case "Column":
      return (
        <Section title="Column">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Columns have no content of their own — set the width and spacing on
            the Style tab, and drop widgets inside.
          </p>
        </Section>
      );

    case "Heading":
      return (
        <Section title="Heading">
          <Field label="Text">
            <TextInput
              value={get("text", "")}
              onChange={(value) => set("text", value)}
              multiline
            />
          </Field>
          <Field label="Level" hint="Use one h1 per page for SEO.">
            <SelectInput
              value={get<(typeof HEADING_LEVELS)[number]>("level", "h2")}
              options={HEADING_LEVELS}
              onChange={(value) => set("level", value ?? "h2")}
            />
          </Field>
          <Field label="Link (optional)">
            <TextInput
              value={get("href", "")}
              placeholder="/shop or https://…"
              onChange={(value) => set("href", value)}
            />
          </Field>
        </Section>
      );

    case "Text":
      return (
        <Section title="Text">
          <Field label="Text" hint="Line breaks are preserved.">
            <TextInput
              value={get("text", "")}
              onChange={(value) => set("text", value)}
              multiline
            />
          </Field>
        </Section>
      );

    case "Image":
      return (
        <Section title="Image">
          <Field label="Image" hint="Upload a file, or paste a URL.">
            <MediaField
              value={get("url", "")}
              onChange={(value) => set("url", value)}
              accept="image/*"
            />
          </Field>
          <Field
            label="Alt text"
            hint="Describes the image for screen readers."
          >
            <TextInput
              value={get("alt", "")}
              onChange={(value) => set("alt", value)}
            />
          </Field>
          <Field label="Aspect ratio">
            <SelectInput
              value={get<string>("aspectRatio", "auto")}
              options={["auto", "1/1", "4/3", "3/2", "16/9", "3/4"] as const}
              onChange={(value) => set("aspectRatio", value ?? "auto")}
            />
          </Field>
          <Field label="Fit">
            <SelectInput
              value={get<string>("objectFit", "cover")}
              options={["cover", "contain", "fill"] as const}
              onChange={(value) => set("objectFit", value ?? "cover")}
            />
          </Field>
          <Field label="Link (optional)">
            <TextInput
              value={get("href", "")}
              onChange={(value) => set("href", value)}
            />
          </Field>
        </Section>
      );

    case "Button":
      return (
        <Section title="Button">
          <Field label="Text">
            <TextInput
              value={get("text", "")}
              onChange={(value) => set("text", value)}
            />
          </Field>
          <Field label="Link">
            <TextInput
              value={get("href", "#")}
              placeholder="/shop, #contact, https://…"
              onChange={(value) => set("href", value)}
            />
          </Field>
          <CheckboxInput
            checked={get("newTab", false)}
            onChange={(checked) => set("newTab", checked)}
            label="Open in a new tab"
          />
          <Field label="Size">
            <SelectInput
              value={get<string>("size", "md")}
              options={["sm", "md", "lg"] as const}
              onChange={(value) => set("size", value ?? "md")}
            />
          </Field>
          <Field label="Icon (optional)">
            <IconPicker
              value={get<IconName | undefined>("icon", undefined)}
              onChange={(value) => set("icon", value)}
              allowNone
            />
          </Field>
          <Field label="Icon position">
            <SelectInput
              value={get<string>("iconPosition", "left")}
              options={["left", "right"] as const}
              onChange={(value) => set("iconPosition", value ?? "left")}
            />
          </Field>
        </Section>
      );

    case "Divider":
      return (
        <Section title="Divider">
          <Field label="Thickness (px)">
            <NumberInput
              value={get("thickness", 1)}
              min={1}
              max={40}
              onChange={(value) => set("thickness", value ?? 1)}
            />
          </Field>
          <Field label="Style">
            <SelectInput
              value={get<string>("style", "solid")}
              options={["solid", "dashed", "dotted"] as const}
              onChange={(value) => set("style", value ?? "solid")}
            />
          </Field>
          <Field label="Width (%)">
            <NumberInput
              value={get("widthPercent", 100)}
              min={5}
              max={100}
              onChange={(value) => set("widthPercent", value ?? 100)}
            />
          </Field>
        </Section>
      );

    case "Spacer": {
      const height = responsiveProp("height");
      return (
        <Section title="Spacer">
          <Field
            label="Height (px)"
            hint="Set a smaller height on mobile to keep pages tight."
            inherited={height.inherited}
            onClear={height.onClear}
          >
            <NumberInput
              value={height.value}
              min={0}
              max={800}
              onChange={height.set}
            />
          </Field>
        </Section>
      );
    }

    case "Icon": {
      const size = responsiveProp("size");
      return (
        <Section title="Icon">
          <Field label="Icon">
            <IconPicker
              value={get<IconName>("name", "star")}
              onChange={(value) => set("name", value ?? "star")}
            />
          </Field>
          <Field
            label="Size (px)"
            inherited={size.inherited}
            onClear={size.onClear}
          >
            <NumberInput
              value={size.value}
              min={8}
              max={400}
              onChange={size.set}
            />
          </Field>
          <Field label="Link (optional)">
            <TextInput
              value={get("href", "")}
              onChange={(value) => set("href", value)}
            />
          </Field>
        </Section>
      );
    }

    case "Shape": {
      const height = responsiveProp("height");
      return (
        <Section title="Shape">
          <Field label="Shape">
            <SelectInput
              value={get<string>("shape", "rectangle")}
              options={SHAPES}
              onChange={(value) => set("shape", value ?? "rectangle")}
            />
          </Field>
          <Field
            label="Height (px)"
            hint="Colour it with the Style tab's background."
            inherited={height.inherited}
            onClear={height.onClear}
          >
            <NumberInput
              value={height.value}
              min={4}
              max={1200}
              onChange={height.set}
            />
          </Field>
        </Section>
      );
    }

    case "Video":
      return (
        <Section title="Video">
          <Field
            label="Video"
            hint="Upload an MP4/WebM file, or paste a YouTube or Vimeo link."
          >
            <MediaField
              value={get("url", "")}
              onChange={(value) => set("url", value)}
              accept="video/mp4,video/webm"
              kind="video"
            />
          </Field>
          <Field label="Aspect ratio">
            <SelectInput
              value={get<string>("aspectRatio", "16/9")}
              options={["16/9", "4/3", "1/1"] as const}
              onChange={(value) => set("aspectRatio", value ?? "16/9")}
            />
          </Field>
          <CheckboxInput
            checked={get("controls", true)}
            onChange={(checked) => set("controls", checked)}
            label="Show player controls"
          />
        </Section>
      );
  }
}
