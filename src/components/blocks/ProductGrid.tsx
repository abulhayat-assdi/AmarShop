import type { ProductGridData } from "@/lib/blocks/schemas";
import { BlockImage } from "./BlockImage";

const COLUMN_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function formatPrice(price: number): string {
  return `৳${price.toLocaleString("en-US")}`;
}

export function ProductGrid({ heading, columns, products }: ProductGridData) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      {heading && (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          {heading}
        </h2>
      )}
      <div className={`grid grid-cols-1 gap-6 ${COLUMN_CLASS[columns]}`}>
        {products.map((product, i) => (
          <article
            key={i}
            className="group overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
          >
            <div className="relative aspect-square overflow-hidden bg-black/5 dark:bg-white/5">
              {product.imageUrl && (
                <BlockImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              {product.badge && (
                <span className="bg-foreground text-background absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-medium">
                  {product.badge}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <h3 className="truncate text-sm font-medium">{product.name}</h3>
              <span className="shrink-0 text-sm font-semibold">
                {formatPrice(product.price)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
