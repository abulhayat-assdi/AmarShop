"use server";

import type { TenantStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import {
  deleteTenant,
  setGatewayApproval,
  setTenantPlan,
  setTenantStatus,
} from "@/lib/admin/tenants";
import { FEATURE_KEYS, type FeatureKey, setTenantFeature } from "@/lib/features";

const TENANT_STATUSES = ["active", "suspended", "trial"] as const;

export async function setStatusAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("tenantId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(TENANT_STATUSES as readonly string[]).includes(status)) return;

  await setTenantStatus(id, status as TenantStatus);
  revalidatePath(`/admin/tenants/${id}`);
  revalidatePath("/admin/tenants");
}

export async function setPlanAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("tenantId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  if (!id) return;

  await setTenantPlan(id, planId || null);
  revalidatePath(`/admin/tenants/${id}`);
}

export async function setGatewayAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("tenantId") ?? "");
  if (!id) return;

  await setGatewayApproval(id, formData.get("approved") === "true");
  revalidatePath(`/admin/tenants/${id}`);
}

export async function setFeatureAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("tenantId") ?? "");
  const key = String(formData.get("featureKey") ?? "");
  if (!id || !(FEATURE_KEYS as readonly string[]).includes(key)) return;

  await setTenantFeature(id, key as FeatureKey, formData.get("enabled") === "true");
  revalidatePath(`/admin/tenants/${id}`);
}

export async function deleteTenantAction(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("tenantId") ?? "");
  if (!id) return;

  await deleteTenant(id);
  redirect("/admin/tenants");
}
