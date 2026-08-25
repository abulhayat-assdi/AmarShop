"use server";

import type { TenantStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/permissions";
import {
  deleteTenant,
  setGatewayApproval,
  setTenantPlan,
  setTenantStatus,
} from "@/lib/admin/tenants";
import {
  FEATURE_KEYS,
  type FeatureKey,
  setTenantFeature,
} from "@/lib/features";

const TENANT_STATUSES = ["active", "suspended", "trial"] as const;

export async function setStatusAction(formData: FormData) {
  const session = await requirePermission("tenants", "edit");
  const id = String(formData.get("tenantId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(TENANT_STATUSES as readonly string[]).includes(status)) return;

  await setTenantStatus(id, status as TenantStatus);
  await logAudit({
    actorUserId: session.user.id,
    action: "tenant.status",
    resource: "tenants",
    targetId: id,
    meta: { status },
  });
  revalidatePath(`/admin/tenants/${id}`);
  revalidatePath("/admin/tenants");
}

export async function setPlanAction(formData: FormData) {
  const session = await requirePermission("tenants", "edit");
  const id = String(formData.get("tenantId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  if (!id) return;

  await setTenantPlan(id, planId || null);
  await logAudit({
    actorUserId: session.user.id,
    action: "tenant.plan",
    resource: "tenants",
    targetId: id,
    meta: { planId: planId || null },
  });
  revalidatePath(`/admin/tenants/${id}`);
}

export async function setGatewayAction(formData: FormData) {
  const session = await requirePermission("tenants", "edit");
  const id = String(formData.get("tenantId") ?? "");
  if (!id) return;

  const approved = formData.get("approved") === "true";
  await setGatewayApproval(id, approved);
  await logAudit({
    actorUserId: session.user.id,
    action: "tenant.gateway_approval",
    resource: "tenants",
    targetId: id,
    meta: { approved },
  });
  revalidatePath(`/admin/tenants/${id}`);
}

export async function setFeatureAction(formData: FormData) {
  const session = await requirePermission("tenants", "edit");
  const id = String(formData.get("tenantId") ?? "");
  const key = String(formData.get("featureKey") ?? "");
  if (!id || !(FEATURE_KEYS as readonly string[]).includes(key)) return;

  const enabled = formData.get("enabled") === "true";
  await setTenantFeature(id, key as FeatureKey, enabled);
  await logAudit({
    actorUserId: session.user.id,
    action: "tenant.feature",
    resource: "tenants",
    targetId: id,
    meta: { featureKey: key, enabled },
  });
  revalidatePath(`/admin/tenants/${id}`);
}

export async function deleteTenantAction(formData: FormData) {
  const session = await requirePermission("tenants", "delete");
  const id = String(formData.get("tenantId") ?? "");
  if (!id) return;

  await deleteTenant(id);
  await logAudit({
    actorUserId: session.user.id,
    action: "tenant.delete",
    resource: "tenants",
    targetId: id,
  });
  redirect("/admin/tenants");
}
