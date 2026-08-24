import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Guards the super-admin area (spec §6.6). Server-side role enforcement — not
 * just UI hiding. Every super-admin page and action must call this.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "super_admin") redirect("/dashboard");
  return session;
}
