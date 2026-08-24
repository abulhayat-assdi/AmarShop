import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RESOURCE_KEYS } from "./permissions";

/** Staff (admin/editor) management for the super-admin (spec §6.7). */

export type PermissionInput = {
  resource: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
};

export async function listStaff() {
  return prisma.staffMember.findMany({
    select: {
      id: true,
      createdAt: true,
      user: { select: { email: true, role: true } },
      permissions: {
        select: {
          resource: true,
          canView: true,
          canEdit: true,
          canDelete: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStaff(input: {
  email: string;
  password: string;
  role: "admin" | "editor";
  createdById: string;
  permissions: PermissionInput[];
}): Promise<void> {
  const passwordHash = await hash(input.password, 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, passwordHash, role: input.role },
    });
    const staff = await tx.staffMember.create({
      data: { userId: user.id, createdById: input.createdById },
    });
    for (const p of input.permissions) {
      if (!(RESOURCE_KEYS as string[]).includes(p.resource)) continue;
      await tx.permission.create({
        data: {
          staffId: staff.id,
          resource: p.resource,
          canView: p.view,
          canEdit: p.edit,
          canDelete: p.delete,
        },
      });
    }
  });
}

export async function updateStaffPermissions(
  staffId: string,
  permissions: PermissionInput[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const p of permissions) {
      if (!(RESOURCE_KEYS as string[]).includes(p.resource)) continue;
      await tx.permission.upsert({
        where: { staffId_resource: { staffId, resource: p.resource } },
        update: { canView: p.view, canEdit: p.edit, canDelete: p.delete },
        create: {
          staffId,
          resource: p.resource,
          canView: p.view,
          canEdit: p.edit,
          canDelete: p.delete,
        },
      });
    }
  });
}

/** Removes a staff member by deleting their user (cascades staff + permissions). */
export async function deleteStaff(staffId: string): Promise<void> {
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffId },
    select: { userId: true },
  });
  if (!staff) return;
  await prisma.user.delete({ where: { id: staff.userId } });
}
