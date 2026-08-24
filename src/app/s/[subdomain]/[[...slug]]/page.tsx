import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockImage } from "@/components/blocks/BlockImage";
import { TemplateRenderer } from "@/components/TemplateRenderer";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { CartView } from "@/components/storefront/CartView";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { formatTaka } from "@/lib/format";
import { getOrder } from "@/lib/tenant/checkout";
import { getTenantBySubdomain } from "@/lib/tenant/context";
import { getSiteConfigBlocks } from "@/lib/tenant/site-config";
import {
  getStorefrontProduct,
  listActiveProducts,
} from "@/lib/tenant/storefront";

type TenantSiteParams = {
  params: Promise<{ subdomain: string; slug?: string[] }>;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
  );
}

export default async function TenantSitePage({ params }: TenantSiteParams) {
  const { subdomain, slug } = await params;

  // Only reachable via the subdomain rewrite (middleware sets this header).
  const viaMiddleware = (await headers()).get("x-tenant-subdomain");
  if (viaMiddleware !== subdomain) notFound();

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  if (tenant.status === "suspended") {
    return (
      <Shell>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Site unavailable
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {tenant.name} is currently suspended.
          </p>
        </div>
      </Shell>
    );
  }

  const section = slug?.[0];
  const schema = tenant.schemaName;

  // Home — the tenant's designed site (spec §5.4).
  if (!section) {
    const blocks = await getSiteConfigBlocks(schema);
    if (Array.isArray(blocks) && blocks.length > 0) {
      return <TemplateRenderer blocks={blocks} />;
    }
    return (
      <Shell>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenant.name}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            This site hasn&apos;t been set up yet.
          </p>
          <Link href="/shop" className="mt-3 inline-block underline">
            Visit the shop
          </Link>
        </div>
      </Shell>
    );
  }

  // Shop — the tenant's real, active products.
  if (section === "shop") {
    const products = await listActiveProducts(schema);
    return (
      <Shell>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Shop</h1>
        {products.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="flex flex-col overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="aspect-square bg-black/5 dark:bg-white/5">
                    {product.images[0] && (
                      <BlockImage
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="truncate text-sm font-medium">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm font-semibold">
                    {formatTaka(product.price)}
                  </p>
                  <AddToCartButton
                    className="mt-auto rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    item={{
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.images[0] ?? null,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </Shell>
    );
  }

  // Product detail.
  if (section === "product" && slug?.[1]) {
    const product = await getStorefrontProduct(schema, slug[1]);
    if (!product) notFound();
    return (
      <Shell>
        <Link
          href="/shop"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Shop
        </Link>
        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
            {product.images[0] && (
              <BlockImage
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="text-xl font-semibold">{formatTaka(product.price)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </p>
            {product.description && (
              <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                {product.description}
              </p>
            )}
            {product.stock > 0 && (
              <AddToCartButton
                item={{
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] ?? null,
                }}
              />
            )}
          </div>
        </div>
      </Shell>
    );
  }

  if (section === "cart") {
    return (
      <Shell>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your cart</h1>
        <CartView />
      </Shell>
    );
  }

  if (section === "checkout") {
    return (
      <Shell>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>
        <CheckoutForm />
      </Shell>
    );
  }

  // Order confirmation.
  if (section === "order" && slug?.[1]) {
    const order = await getOrder(schema, slug[1]);
    if (!order) notFound();
    return (
      <Shell>
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-semibold tracking-tight">
            Order confirmed 🎉
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Order #{order.id.slice(0, 8)} · {order.status} · payment{" "}
            {order.paymentStatus}
          </p>
          <ul className="my-4 flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm dark:border-white/15">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {item.name} × {item.qty}
                </span>
                <span>{formatTaka(item.lineTotal)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-black/10 pt-2 font-semibold dark:border-white/10">
              <span>Total</span>
              <span>{formatTaka(order.total)}</span>
            </li>
          </ul>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;ll contact you to confirm delivery. Thank you!
          </p>
          <Link href="/shop" className="mt-4 inline-block underline">
            Continue shopping
          </Link>
        </div>
      </Shell>
    );
  }

  notFound();
}
