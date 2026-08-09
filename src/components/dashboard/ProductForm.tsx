"use client";

import { useActionState } from "react";
import { saveProduct } from "@/app/dashboard/products/actions";
import type { Product } from "@/lib/tenant/products";
import {
  PRODUCT_STATUSES,
  type ProductFormState,
} from "@/lib/validation/product";

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct,
    {},
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {product && <input type="hidden" name="productId" value={product.id} />}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          name="name"
          required
          maxLength={200}
          defaultValue={product?.name ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={product?.description ?? ""}
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Price (৳)</span>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product?.price ?? 0}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Stock</span>
          <input
            name="stock"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product?.stock ?? 0}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Category</span>
        <input
          name="category"
          maxLength={100}
          defaultValue={product?.category ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Status</span>
        <select
          name="status"
          defaultValue={product?.status ?? "active"}
          className={fieldClass}
        >
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status} className="text-black">
              {status}
            </option>
          ))}
        </select>
      </label>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 self-start rounded-md bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
