import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type TenantContext = {
  userId: string;
  email: string;
  tenantId: string;
  schema: string;
  subdomain: string;
};

/**
 * Resolves the signed-in owner's tenant context for the admin area.
 *
 * Redirects to /login when unauthenticated and to /dashboard when the account
 * has no tenant (e.g. a super-admin). The schema returned here is the ONLY
 * schema the admin data layer touches — it comes from the session (server-side,
 * from the signed JWT), never from the request — which enforces tenant isolation.
 * Server actions must call this too; a layout guard alone does not protect them.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const session = await auth();
  if (!session) redirect("/login");

  const { id, email, tenantId, tenantSchema, tenantSubdomain } = session.user;
  if (!tenantId || !tenantSchema || !tenantSubdomain) {
    redirect("/dashboard");
  }

  return {
    userId: id,
    email: email ?? "",
    tenantId,
    schema: tenantSchema,
    subdomain: tenantSubdomain,
  };
}
