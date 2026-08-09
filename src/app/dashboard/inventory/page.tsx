import { requireTenantContext } from "@/lib/auth/current-tenant";
import { listProducts } from "@/lib/tenant/products";
import { setStockAction } from "./actions";

export default async function InventoryPage() {
  const { schema } = await requireTenantContext();
  const products = await listProducts(schema);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Adjust stock levels. Rows with 5 or fewer units are highlighted.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          No products yet. Add products first to manage inventory.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Current stock</th>
                <th className="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/10"
                >
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock <= 5
                          ? "font-semibold text-amber-600 dark:text-amber-400"
                          : ""
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={setStockAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="productId" value={product.id} />
                      <input
                        name="stock"
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={product.stock}
                        className="w-24 rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-black/15 px-2 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                      >
                        Save
                      </button>
                    </form>
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
