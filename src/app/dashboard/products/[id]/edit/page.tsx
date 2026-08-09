import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { getProduct } from "@/lib/tenant/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { schema } = await requireTenantContext();
  const { id } = await params;
  const product = await getProduct(schema, id);
  if (!product) notFound();

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
          Edit product
        </h1>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
