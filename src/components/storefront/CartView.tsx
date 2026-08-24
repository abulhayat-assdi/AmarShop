"use client";

import Link from "next/link";
import { BlockImage } from "@/components/blocks/BlockImage";
import { formatTaka } from "@/lib/format";
import { useCart } from "./CartProvider";

export function CartView() {
  const { items, total, setQty, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">Your cart is empty.</p>
        <Link href="/shop" className="mt-3 inline-block underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 py-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-black/5 dark:bg-white/5">
              {item.image && (
                <BlockImage
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatTaka(item.price)}
              </p>
            </div>
            <input
              type="number"
              min={1}
              value={item.qty}
              onChange={(e) =>
                setQty(item.productId, Math.max(1, Number(e.target.value)))
              }
              className="w-16 rounded border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
            />
            <p className="w-24 text-right text-sm font-medium">
              {formatTaka(item.price * item.qty)}
            </p>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-sm text-red-600 hover:underline dark:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
        <span className="text-lg font-semibold">Total: {formatTaka(total)}</span>
        <Link
          href="/checkout"
          className="rounded-md bg-foreground px-5 py-2.5 font-medium text-background transition-opacity hover:opacity-90"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
