import Link from "next/link";
import type { BlogListData } from "@/lib/blocks/schemas";

export function BlogList({ heading, posts }: BlogListData) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
      {heading && (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          {heading}
        </h2>
      )}
      <div className="flex flex-col gap-6">
        {posts.map((post, i) => (
          <article
            key={i}
            className="border-b border-black/10 pb-6 last:border-0 dark:border-white/10"
          >
            {post.date && (
              <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
                {post.date}
              </p>
            )}
            <h3 className="text-lg font-medium">
              <Link href={post.href} className="hover:underline">
                {post.title}
              </Link>
            </h3>
            {post.excerpt && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {post.excerpt}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
