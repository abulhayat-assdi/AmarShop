import { CartProvider } from "@/components/storefront/CartProvider";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { getTenantBySubdomain } from "@/lib/tenant/context";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);

  return (
    <CartProvider>
      {tenant && <StorefrontHeader shopName={tenant.name} />}
      {children}
    </CartProvider>
  );
}
