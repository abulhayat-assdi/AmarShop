import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getImpersonatedTenantId } from "@/lib/admin/impersonation";
import { prisma } from "@/lib/prisma";

export type EffectiveTenant = {
  tenantId: string;
  schema: string;
  subdomain: string;
  impersonating: boolean;
};

export type TenantContext = EffectiveTenant & {
  userId: string;
  email: string;
};

/**
 * Resolves the tenant a dashboard request should act on, honoring super-admin
 * impersonation (spec §6.6). Non-throwing — returns null tenant for a signed-out
 * user or a super-admin who is not currently impersonating.
 *
 * The impersonation cookie is honored ONLY for a live super-admin session, so a
 * stray cookie never grants tenant access to anyone else.
 */
export async function resolveEffectiveTenant(): Promise<{
  authenticated: boolean;
  isSuperAdmin: boolean;
  role: string;
  tenant: EffectiveTenant | null;
  userId: string;
  email: string;
}> {
  const session = await auth();
  if (!session) {
    return {
      authenticated: false,
      isSuperAdmin: false,
      role: "",
      tenant: null,
      userId: "",
      email: "",
    };
  }

  const base = {
    authenticated: true,
    isSuperAdmin: session.user.role === "super_admin",
    role: session.user.role,
    userId: session.user.id,
    email: session.user.email ?? "",
  };

  if (base.isSuperAdmin) {
    const impersonatedId = await getImpersonatedTenantId();
    if (impersonatedId) {
      const t = await prisma.tenant.findUnique({
        where: { id: impersonatedId },
        select: { id: true, schemaName: true, subdomain: true },
      });
      if (t) {
        return {
          ...base,
          tenant: {
            tenantId: t.id,
            schema: t.schemaName,
            subdomain: t.subdomain,
            impersonating: true,
          },
        };
      }
    }
    return { ...base, tenant: null };
  }

  const { tenantId, tenantSchema, tenantSubdomain } = session.user;
  if (tenantId && tenantSchema && tenantSubdomain) {
    return {
      ...base,
      tenant: {
        tenantId,
        schema: tenantSchema,
        subdomain: tenantSubdomain,
        impersonating: false,
      },
    };
  }
  return { ...base, tenant: null };
}

/**
 * Requires an effective tenant for the admin area. Redirects to /login when
 * signed out, to /admin for a super-admin who is not impersonating, and to
 * /dashboard for an account that has no tenant. Server actions must call this
 * too; a layout guard alone does not protect them.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const resolved = await resolveEffectiveTenant();
  if (!resolved.authenticated) redirect("/login");
  if (!resolved.tenant) {
    // Staff (super_admin / admin / editor) belong in the admin area, not a
    // tenant dashboard; anyone else without a tenant goes to /dashboard.
    const isStaff = ["super_admin", "admin", "editor"].includes(resolved.role);
    redirect(isStaff ? "/admin" : "/dashboard");
  }
  return {
    ...resolved.tenant,
    userId: resolved.userId,
    email: resolved.email,
  };
}
