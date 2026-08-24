"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/admin/audit";
import { RESOURCE_KEYS } from "@/lib/admin/permissions";
import { requireSuperAdmin } from "@/lib/admin/require-super-admin";
import {
  createStaff,
  deleteStaff,
  type PermissionInput,
  updateStaffPermissions,
} from "@/lib/admin/staff";
import { staffFormSchema, type StaffFormState } from "@/lib/validation/staff";

function parsePermissions(formData: FormData): PermissionInput[] {
  return RESOURCE_KEYS.map((resource) => ({
    resource,
    view: formData.get(`perm_${resource}_view`) === "on",
    edit: formData.get(`perm_${resource}_edit`) === "on",
    delete: formData.get(`perm_${resource}_delete`) === "on",
  }));
}

export async function addStaffAction(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const session = await requireSuperAdmin();

  const parsed = staffFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await createStaff({
      ...parsed.data,
      createdById: session.user.id,
      permissions: parsePermissions(formData),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "An account with this email already exists." };
    }
    throw error;
  }

  await logAudit({
    actorUserId: session.user.id,
    action: "staff.create",
    resource: "access_management",
    meta: { email: parsed.data.email, role: parsed.data.role },
  });
  redirect("/admin/access");
}

export async function updateStaffAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  await updateStaffPermissions(staffId, parsePermissions(formData));
  await logAudit({
    actorUserId: session.user.id,
    action: "staff.permissions",
    resource: "access_management",
    targetId: staffId,
  });
  revalidatePath("/admin/access");
}

export async function deleteStaffAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  await deleteStaff(staffId);
  await logAudit({
    actorUserId: session.user.id,
    action: "staff.delete",
    resource: "access_management",
    targetId: staffId,
  });
  revalidatePath("/admin/access");
}
