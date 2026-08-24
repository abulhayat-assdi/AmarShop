"use server";

import { redirect } from "next/navigation";
import {
  clearImpersonation,
  setImpersonation,
} from "@/lib/admin/impersonation";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import { prisma } from "@/lib/prisma";

/**
 * Starts impersonating a tenant (spec §6.6). Only a super-admin may set the
 * impersonation cookie, and the target tenant must exist.
 */
export async function startImpersonationAction(formData: FormData) {
  await requireSuperAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  if (!tenant) return;

  await setImpersonation(tenant.id);
  redirect("/dashboard");
}

/** Stops impersonating and returns to the super-admin panel. */
export async function stopImpersonationAction() {
  await requireSuperAdmin();
  await clearImpersonation();
  redirect("/admin");
}
