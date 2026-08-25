"use client";

import type { Breakpoint } from "@/lib/elements/responsive";
import { resolveResponsive } from "@/lib/elements/responsive";
import {
  BACKGROUND_POSITIONS,
  BACKGROUND_SIZES,
  BORDER_STYLES,
  type ElementStyle,
  FLEX_ALIGNMENTS,
  FLEX_JUSTIFY,
  FONT_FAMILIES,
  SHADOW_PRESETS,
  TEXT_ALIGNS,
  TEXT_TRANSFORMS,
} from "@/lib/elements/style";
import type { ElementNode } from "@/lib/elements/tree";
import { isContainer } from "@/lib/elements/widgets";
import {
  CheckboxInput,
  ColorInput,
  Field,
  NumberInput,
  Section,
  SelectInput,
  SidesInput,
} from "./controls";

/**
 * The Style tab of the inspector (spec §5.7).
 *
 * Every control writes to the current breakpoint only. A control whose value
 * comes from a wider breakpoint is marked "inherited"; typing sets an override
 * for this breakpoint, and "clear" removes it again.
 */
export function StylePanel({
  node,
  breakpoint,
  onChange,
}: {
  node: ElementNode;
  breakpoint: Breakpoint;
  onChange: (key: keyof ElementStyle, value: unknown) => void;
}) {
  /** The value set at this exact breakpoint (not inherited). */
  function own<T>(key: keyof ElementStyle): T | undefined {
    const bag = node.style[key] as Record<string, unknown> | undefined;
    return bag?.[breakpoint] as T | undefined;
  }

  /** The value in effect here, following inheritance. */
  function effective<T>(key: keyof ElementStyle): T | undefined {
    return resolveResponsive(
      node.style[key] as Record<Breakpoint, T> | undefined,
      breakpoint,
    );
  }

  function isInherited(key: keyof ElementStyle): boolean {
    return own(key) === undefined && effective(key) !== undefined;
  }

  function field<T>(key: keyof ElementStyle) {
    return {
      inherited: isInherited(key),
      onClear: own(key) !== undefined ? () => onChange(key, "") : undefined,
      value: effective<T>(key),
      set: (value: T | undefined) => onChange(key, value ?? ""),
    };
  }

  const container = isContainer(node.type);

  return (
    <div className="flex flex-col">
      <Section title="Layout">
        {(() => {
          const f = field<string>("align");
          return (
            <Field
              label="Text align"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SelectInput
                value={f.value}
                options={TEXT_ALIGNS}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}

        {container && (
          <>
            {(() => {
              const f = field<string>("justifyContent");
              return (
                <Field
                  label="Justify content"
                  inherited={f.inherited}
                  onClear={f.onClear}
                >
                  <SelectInput
                    value={f.value}
                    options={FLEX_JUSTIFY}
                    onChange={f.set}
                    allowEmpty
                  />
                </Field>
              );
            })()}
            {(() => {
              const f = field<string>("alignItems");
              return (
                <Field
                  label="Align items"
                  inherited={f.inherited}
                  onClear={f.onClear}
                >
                  <SelectInput
                    value={f.value}
                    options={FLEX_ALIGNMENTS}
                    onChange={f.set}
                    allowEmpty
                  />
                </Field>
              );
            })()}
            {(() => {
              const f = field<number>("gap");
              return (
                <Field
                  label="Gap (px)"
                  inherited={f.inherited}
                  onClear={f.onClear}
                >
                  <NumberInput
                    value={f.value}
                    min={0}
                    max={200}
                    onChange={f.set}
                  />
                </Field>
              );
            })()}
          </>
        )}

        {(() => {
          const f = field<number>("widthPercent");
          return (
            <Field
              label="Width (%)"
              hint="Leave empty to fill the available space."
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <NumberInput value={f.value} min={1} max={100} onChange={f.set} />
            </Field>
          );
        })()}

        {(() => {
          const f = field<number>("minHeight");
          return (
            <Field
              label="Min height (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <NumberInput
                value={f.value}
                min={0}
                max={4000}
                onChange={f.set}
              />
            </Field>
          );
        })()}

        {(() => {
          const f = field<boolean>("hidden");
          return (
            <Field
              label="Visibility"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <CheckboxInput
                checked={f.value === true}
                onChange={(checked) => onChange("hidden", checked ? true : "")}
                label={`Hide on ${breakpoint === "base" ? "desktop" : breakpoint}`}
              />
            </Field>
          );
        })()}
      </Section>

      <Section title="Spacing">
        {(() => {
          const f = field<Record<string, number | undefined>>("padding");
          return (
            <Field
              label="Padding (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SidesInput
                value={f.value}
                keys={["top", "right", "bottom", "left"]}
                labels={["T", "R", "B", "L"]}
                min={-200}
                max={400}
                onChange={f.set}
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<Record<string, number | undefined>>("margin");
          return (
            <Field
              label="Margin (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SidesInput
                value={f.value}
                keys={["top", "right", "bottom", "left"]}
                labels={["T", "R", "B", "L"]}
                min={-200}
                max={400}
                onChange={f.set}
              />
            </Field>
          );
        })()}
      </Section>

      <Section title="Typography">
        {(() => {
          const f = field<string>("fontFamily");
          return (
            <Field label="Font" inherited={f.inherited} onClear={f.onClear}>
              <SelectInput
                value={f.value}
                options={FONT_FAMILIES}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<number>("fontSize");
          return (
            <Field
              label="Size (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <NumberInput value={f.value} min={8} max={200} onChange={f.set} />
            </Field>
          );
        })()}
        {(() => {
          const f = field<number>("fontWeight");
          return (
            <Field label="Weight" inherited={f.inherited} onClear={f.onClear}>
              <NumberInput
                value={f.value}
                min={100}
                max={900}
                step={100}
                onChange={f.set}
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<number>("lineHeight");
          return (
            <Field
              label="Line height"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <NumberInput
                value={f.value}
                min={0.7}
                max={4}
                step={0.1}
                onChange={f.set}
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<number>("letterSpacing");
          return (
            <Field
              label="Letter spacing (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <NumberInput
                value={f.value}
                min={-10}
                max={40}
                step={0.5}
                onChange={f.set}
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("textTransform");
          return (
            <Field
              label="Transform"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SelectInput
                value={f.value}
                options={TEXT_TRANSFORMS}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("color");
          return (
            <Field
              label="Text colour"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <ColorInput value={f.value} onChange={f.set} />
            </Field>
          );
        })()}
      </Section>

      <Section title="Background">
        {(() => {
          const f = field<string>("backgroundColor");
          return (
            <Field label="Colour" inherited={f.inherited} onClear={f.onClear}>
              <ColorInput value={f.value} onChange={f.set} />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("backgroundImage");
          return (
            <Field
              label="Image URL"
              hint="https://… or /uploads/…"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <input
                type="text"
                value={f.value ?? ""}
                onChange={(event) => f.set(event.target.value || undefined)}
                className="w-full rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-black/40 dark:border-white/20"
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("backgroundSize");
          return (
            <Field label="Size" inherited={f.inherited} onClear={f.onClear}>
              <SelectInput
                value={f.value}
                options={BACKGROUND_SIZES}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("backgroundPosition");
          return (
            <Field label="Position" inherited={f.inherited} onClear={f.onClear}>
              <SelectInput
                value={f.value}
                options={BACKGROUND_POSITIONS}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}
      </Section>

      <Section title="Border & effects">
        {(() => {
          const f = field<string>("borderStyle");
          return (
            <Field
              label="Border style"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SelectInput
                value={f.value}
                options={BORDER_STYLES}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<Record<string, number | undefined>>("borderWidth");
          return (
            <Field
              label="Border width (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SidesInput
                value={f.value}
                keys={["top", "right", "bottom", "left"]}
                labels={["T", "R", "B", "L"]}
                min={0}
                max={40}
                onChange={f.set}
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("borderColor");
          return (
            <Field
              label="Border colour"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <ColorInput value={f.value} onChange={f.set} />
            </Field>
          );
        })()}
        {(() => {
          const f = field<Record<string, number | undefined>>("borderRadius");
          return (
            <Field
              label="Radius (px)"
              inherited={f.inherited}
              onClear={f.onClear}
            >
              <SidesInput
                value={f.value}
                keys={["topLeft", "topRight", "bottomRight", "bottomLeft"]}
                labels={["TL", "TR", "BR", "BL"]}
                min={0}
                max={400}
                onChange={f.set}
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<string>("shadow");
          return (
            <Field label="Shadow" inherited={f.inherited} onClear={f.onClear}>
              <SelectInput
                value={f.value}
                options={SHADOW_PRESETS}
                onChange={f.set}
                allowEmpty
              />
            </Field>
          );
        })()}
        {(() => {
          const f = field<number>("opacity");
          return (
            <Field label="Opacity" inherited={f.inherited} onClear={f.onClear}>
              <NumberInput
                value={f.value}
                min={0}
                max={1}
                step={0.05}
                onChange={f.set}
              />
            </Field>
          );
        })()}
      </Section>
    </div>
  );
}
