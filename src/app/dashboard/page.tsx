import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenant = session.user.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        include: { plan: true },
      })
    : null;

  const siteUrl = tenant ? `http://${tenant.subdomain}.${env.ROOT_DOMAIN}` : null;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as {session.user.email}
          </p>
        </div>
        <LogoutButton />
      </header>

      {tenant && tenant.status === "suspended" ? (
        <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-6">
          <h2 className="mb-1 text-lg font-medium">Site suspended</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tenant.name} is currently suspended. Please contact support to
            restore access.
          </p>
        </section>
      ) : tenant ? (
        <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
          <h2 className="mb-4 text-lg font-medium">{tenant.name}</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Site address</dt>
            <dd>
              <a href={siteUrl ?? "#"} className="underline">
                {tenant.subdomain}.{env.ROOT_DOMAIN}
              </a>
            </dd>
            <dt className="text-zinc-500 dark:text-zinc-400">Site type</dt>
            <dd>{tenant.siteType}</dd>
            <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
            <dd>{tenant.status}</dd>
            <dt className="text-zinc-500 dark:text-zinc-400">Plan</dt>
            <dd>{tenant.plan?.name ?? "—"}</dd>
          </dl>
        </section>
      ) : (
        <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This account is not attached to a tenant site.
          </p>
          {session.user.role === "super_admin" && (
            <Link href="/admin" className="mt-3 inline-block text-sm underline">
              Go to super-admin →
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
