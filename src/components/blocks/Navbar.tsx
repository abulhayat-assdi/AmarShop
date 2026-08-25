import Link from "next/link";
import type { NavbarData } from "@/lib/blocks/schemas";

export function Navbar({ logoText, links }: NavbarData) {
  return (
    <nav className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
      <span className="text-lg font-semibold tracking-tight">{logoText}</span>
      {links.length > 0 && (
        <ul className="flex gap-6 text-sm">
          {links.map((link, i) => (
            <li key={i}>
              <Link
                href={link.href}
                className="hover:text-foreground text-zinc-600 dark:text-zinc-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
