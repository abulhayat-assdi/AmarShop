"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrderAction } from "@/lib/storefront/actions";
import { formatTaka } from "@/lib/format";
import { useCart } from "./CartProvider";

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function CheckoutForm() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-zinc-500 dark:text-zinc-400">
        Your cart is empty.
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);

    const result = await placeOrderAction({
      customer: {
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        address: String(form.get("address") ?? ""),
        email: String(form.get("email") ?? ""),
      },
      items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
    });

    setPending(false);
    if (result.error || !result.orderId) {
      setError(result.error ?? "Checkout failed.");
      return;
    }
    clear();
    router.push(`/order/${result.orderId}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Delivery details</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Name</span>
          <input name="name" required className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Phone</span>
          <input name="phone" required className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Address</span>
          <textarea name="address" required rows={3} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email (optional)</span>
          <input name="email" type="email" className={fieldClass} />
        </label>

        <p className="rounded-md border border-black/10 p-3 text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          Payment: <strong>Cash on Delivery</strong>. Online payment will be
          available soon.
        </p>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-5 py-2.5 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Placing order…" : "Place order (Cash on Delivery)"}
        </button>
      </div>

      <div className="rounded-lg border border-black/10 p-5 dark:border-white/15">
        <h2 className="mb-3 text-lg font-medium">Order summary</h2>
        <ul className="mb-3 flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {item.name} × {item.qty}
              </span>
              <span className="shrink-0">
                {formatTaka(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-black/10 pt-3 font-semibold dark:border-white/10">
          <span>Total</span>
          <span>{formatTaka(total)}</span>
        </div>
      </div>
    </form>
  );
}
