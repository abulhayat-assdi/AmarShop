import Link from "next/link";
import type { FooterData } from "@/lib/blocks/schemas";

export function Footer({ text, links }: FooterData) {
  return (
    <footer className="mt-auto border-t border-black/10 px-6 py-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      {links.length > 0 && (
        <ul className="mb-3 flex flex-wrap justify-center gap-4">
          {links.map((link, i) => (
            <li key={i}>
              <Link href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {text && <p>{text}</p>}
    </footer>
  );
}
