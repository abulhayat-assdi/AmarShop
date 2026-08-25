import type { IconName } from "@/lib/elements/widgets";

/**
 * The icon set (spec §1.4). Icons are chosen by name from a closed catalogue —
 * users never supply SVG markup, so nothing script-bearing can reach the page.
 * Every path draws on a 24×24 grid and inherits the element's colour.
 */
const PATHS: Record<IconName, string> = {
  star: "M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3z",
  heart: "M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z",
  check: "M4 12.5l5 5L20 6.5",
  cart: "M3 4h2l2.4 11h10.2l2-8H6.5M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z",
  phone:
    "M6 3h3l2 5-2.5 1.5a12 12 0 005 5L15 12l5 2v3a2 2 0 01-2.2 2A16 16 0 014 6.2 2 2 0 016 3z",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  "map-pin":
    "M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11zm0-8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-14v5l3.5 2",
  truck:
    "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  shield: "M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z",
  tag: "M3 12l9-9h8v8l-9 9-8-8zm13-4.5a1 1 0 100-2 1 1 0 000 2z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.5-4.5",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0",
  menu: "M4 7h16M4 12h16M4 17h16",
  "arrow-right": "M4 12h15m0 0l-6-6m6 6l-6 6",
  facebook: "M14 8h3V4h-3a5 5 0 00-5 5v2H6v4h3v7h4v-7h3l1-4h-4V9a1 1 0 011-1z",
  instagram:
    "M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM17.5 6a.9.9 0 100 1.8.9.9 0 000-1.8z",
  whatsapp:
    "M3.5 20.5l1.3-4.4A8.3 8.3 0 1112 20.3a8.4 8.4 0 01-4-1l-4.5 1.2zM9 8.5c-.4 0-.7.2-.9.6-.3.6-.5 1.6.4 2.9a8 8 0 003.4 3c1.3.5 1.9.4 2.4.2.4-.2.8-.7.9-1.1.1-.4 0-.6-.2-.7l-1.7-.8c-.2-.1-.4 0-.6.2l-.5.6c-.1.2-.3.2-.5.1a6 6 0 01-2.4-2.3c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.1-.5L9.6 8.9c-.1-.3-.3-.4-.6-.4z",
  youtube:
    "M3 8a3 3 0 013-3h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8zm7 1.5v5l4.5-2.5L10 9.5z",
};

/** Icons that read better filled than stroked. */
const FILLED: ReadonlySet<IconName> = new Set([
  "facebook",
  "instagram",
  "whatsapp",
  "youtube",
  "star",
  "heart",
]);

export function ElementIcon({
  name,
  size,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const filled = FILLED.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
