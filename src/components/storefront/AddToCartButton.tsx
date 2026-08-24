"use client";

import { type CartItem, useCart } from "./CartProvider";

export function AddToCartButton({
  item,
  className,
}: {
  item: Omit<CartItem, "qty">;
  className?: string;
}) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className={
        className ??
        "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      }
    >
      Add to cart
    </button>
  );
}
