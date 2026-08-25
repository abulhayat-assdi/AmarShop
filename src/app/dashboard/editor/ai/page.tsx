import Link from "next/link";
import { AiEditPanel } from "@/components/dashboard/AiEditPanel";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { parseBlocks } from "@/lib/blocks/schemas";
import { getSiteConfigBlocks } from "@/lib/tenant/site-config";

export default async function AiEditPage() {
  const { schema } = await requireTenantContext();
  const blocks = parseBlocks(await getSiteConfigBlocks(schema));
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI edit</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Describe a change in plain language and AI updates your site&apos;s
          layout.{" "}
          <Link href="/dashboard/editor" className="underline">
            Open the visual editor →
          </Link>
        </p>
      </div>

      <AiEditPanel configured={configured} />

      <section>
        <h2 className="mb-2 text-sm font-medium">
          Current layout ({blocks.length} block{blocks.length === 1 ? "" : "s"})
        </h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No layout yet — apply a template or use the editor first.
          </p>
        ) : (
          <ol className="flex flex-wrap gap-2 text-xs">
            {blocks.map((block, i) => (
              <li
                key={i}
                className="rounded-full border border-black/10 px-3 py-1 font-mono dark:border-white/15"
              >
                {block.type}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
