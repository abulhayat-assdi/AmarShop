import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { listProducts } from "@/lib/tenant/products";
import { deleteProductAction } from "./actions";

function formatPrice(price: number): string {
  return `৳${price.toLocaleString("en-US")}`;
}

export default async function ProductsPage() {
  const { schema } = await requireTenantContext();
  const products = await listProducts(schema);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No products yet. Add your first product to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {product.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {product.status}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteProductAction}>
                        <input
                          type="hidden"
                          name="productId"
                          value={product.id}
                        />
                        <button
                          type="submit"
                          className="text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
