import Link from "next/link";
import type { CategoryBarData } from "@/lib/blocks/schemas";

export function CategoryBar({ categories }: CategoryBarData) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2 border-b border-black/10 px-6 py-3 dark:border-white/10">
      {categories.map((category, i) => (
        <Link
          key={i}
          href={category.href}
          className="rounded-full border border-black/10 px-3 py-1 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          {category.label}
        </Link>
      ))}
    </div>
  );
}
