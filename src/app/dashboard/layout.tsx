import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/inventory", label: "Inventory" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");

  const hasTenant = Boolean(session.user.tenantId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
      <aside className="shrink-0 md:w-48">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          AmarShop
        </Link>
        <p className="mt-1 mb-6 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {session.user.email}
        </p>

        {hasTenant && (
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
  );
}
