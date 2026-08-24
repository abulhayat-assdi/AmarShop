"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function StorefrontHeader({ shopName }: { shopName: string }) {
  const { count } = useCart();
  return (
    <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/10">
      <Link href="/" className="font-semibold tracking-tight">
        {shopName}
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/shop" className="hover:underline">
          Shop
        </Link>
        <Link href="/cart" className="hover:underline">
          Cart ({count})
        </Link>
      </nav>
    </header>
  );
}
