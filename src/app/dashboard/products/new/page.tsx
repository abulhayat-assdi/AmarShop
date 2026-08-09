import Link from "next/link";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { ProductForm } from "@/components/dashboard/ProductForm";

export default async function NewProductPage() {
  await requireTenantContext();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/products"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Products
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Add product
        </h1>
      </div>
      <ProductForm />
    </div>
  );
}
