import { CartProvider } from "@/components/storefront/CartProvider";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { resolveRequestTenant } from "@/lib/tenant/context";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await resolveRequestTenant();

  return (
    <CartProvider>
      {tenant && <StorefrontHeader shopName={tenant.name} />}
      {children}
    </CartProvider>
  );
}
