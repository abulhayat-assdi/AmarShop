import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getEffectivePermissions, requireStaff } from "@/lib/admin/permissions";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireStaff();
  const perms = await getEffectivePermissions(
    session.user.id,
    session.user.role,
  );
  const isSuperAdmin = session.user.role === "super_admin";

  const nav = [
    { href: "/admin", label: "Overview", show: true },
    { href: "/admin/tenants", label: "Tenants", show: perms.tenants.view },
    {
      href: "/admin/templates",
      label: "Templates",
      show: perms.templates.view,
    },
    { href: "/admin/billing", label: "Billing", show: perms.billing.view },
    { href: "/admin/audit", label: "Audit log", show: perms.audit.view },
    { href: "/admin/access", label: "Access", show: isSuperAdmin },
  ].filter((item) => item.show);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
      <aside className="shrink-0 md:w-48">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          AmarShop
        </Link>
        <p className="mt-1 mb-6 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {session.user.role} · {session.user.email}
        </p>
        <nav className="mb-6 flex flex-col gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground rounded-md px-2 py-1.5 text-zinc-600 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
