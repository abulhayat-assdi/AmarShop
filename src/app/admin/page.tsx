import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Super-admin entry point. Server-side role enforcement (not just UI hiding,
 * spec §6.7). The full super-admin panel is built in Module 6.
 */
export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Super-admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as {session.user.email}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-lg border border-black/10 p-6 dark:border-white/15">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          The full super-admin panel (tenant management, templates, feature
          flags, billing) is built in Module 6. This route confirms server-side
          role enforcement is in place.
        </p>
      </section>
    </main>
  );
}
