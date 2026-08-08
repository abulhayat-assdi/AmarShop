import type { GalleryData } from "@/lib/blocks/schemas";
import { BlockImage } from "./BlockImage";

export function Gallery({ heading, images }: GalleryData) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      {heading && (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{heading}</h2>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <div
            key={i}
            className="aspect-square overflow-hidden rounded-lg bg-black/5 dark:bg-white/5"
          >
            <BlockImage
              src={image.url}
              alt={image.alt ?? ""}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
