import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { resolveEffectiveTenant } from "@/lib/auth/current-tenant";
import { stopImpersonationAction } from "@/app/admin/impersonation-actions";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/inventory", label: "Inventory" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { authenticated, email, tenant } = await resolveEffectiveTenant();
  if (!authenticated) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      {tenant?.impersonating && (
        <div className="flex items-center justify-center gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
          <span>
            Impersonating <strong>{tenant.subdomain}</strong>
          </span>
          <form action={stopImpersonationAction}>
            <button type="submit" className="font-medium underline">
              Exit
            </button>
          </form>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <aside className="shrink-0 md:w-48">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight"
          >
            AmarShop
          </Link>
          <p className="mt-1 mb-6 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {email}
          </p>

          {tenant && (
            <nav className="mb-6 flex flex-col gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-1.5 text-zinc-600 transition-colors hover:bg-black/5 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <LogoutButton />
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
