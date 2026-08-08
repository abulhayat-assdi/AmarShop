import type { AboutSectionData } from "@/lib/blocks/schemas";
import { BlockImage } from "./BlockImage";

export function AboutSection({ heading, body, imageUrl }: AboutSectionData) {
  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-6 py-12 md:grid-cols-2">
      {imageUrl && (
        <div className="aspect-video overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
          <BlockImage
            src={imageUrl}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className={imageUrl ? "" : "text-center md:col-span-2"}>
        <h2 className="mb-3 text-2xl font-semibold tracking-tight">{heading}</h2>
        <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
          {body}
        </p>
      </div>
    </section>
  );
}
