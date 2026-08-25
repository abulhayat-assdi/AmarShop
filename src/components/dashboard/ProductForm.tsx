"use client";

import { useActionState } from "react";
import { saveProduct } from "@/app/dashboard/products/actions";
import { BlockImage } from "@/components/blocks/BlockImage";
import type { Product } from "@/lib/tenant/products";
import {
  PRODUCT_STATUSES,
  type ProductFormState,
} from "@/lib/validation/product";

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction, pending] = useActionState<
    ProductFormState,
    FormData
  >(saveProduct, {});

  const currentImage = product?.images?.[0] ?? "";

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {product && <input type="hidden" name="productId" value={product.id} />}
      <input type="hidden" name="existingImage" value={currentImage} />

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

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Image</span>
        {currentImage && (
          <BlockImage
            src={currentImage}
            alt=""
            className="mb-1 h-24 w-24 rounded-md object-cover"
          />
        )}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-black/15 file:bg-transparent file:px-3 file:py-1.5 file:text-sm dark:text-zinc-400 dark:file:border-white/20"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          JPEG/PNG/WebP/GIF, up to 5&nbsp;MB. Optimized to WebP on upload.
        </span>
      </label>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background mt-1 self-start rounded-md px-4 py-2 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
