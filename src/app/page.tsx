import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:border-white/15 dark:text-zinc-400">
        Phase 1 · Foundation
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        AmarShop
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Multi-tenant SaaS platform to build and run your own website — no code
        required.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-foreground px-5 py-2.5 font-medium text-background transition-opacity hover:opacity-90"
        >
          Create your site
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-black/15 px-5 py-2.5 font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
