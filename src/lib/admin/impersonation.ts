import { cookies } from "next/headers";

/**
 * Impersonation (spec §6.6): a super-admin can safely act as a tenant for
 * support. The target tenant id is kept in an httpOnly cookie set only by a
 * super-admin action. It is honored ONLY when the live session is a super-admin
 * (see requireTenantContext / resolveEffectiveTenant), so a stray cookie on a
 * non-super-admin session grants nothing.
 */
const IMPERSONATION_COOKIE = "impersonate_tenant_id";

export async function getImpersonatedTenantId(): Promise<string | null> {
  const store = await cookies();
  return store.get(IMPERSONATION_COOKIE)?.value ?? null;
}

export async function setImpersonation(tenantId: string): Promise<void> {
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearImpersonation(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
}
