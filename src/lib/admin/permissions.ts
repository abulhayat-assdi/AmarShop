import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  type PermissionAction,
  type PermissionMap,
  RESOURCE_KEYS,
  type ResourceKey,
} from "./resources";

/**
 * RBAC enforcement (spec §6.7). Pure resource/action definitions live in
 * ./resources (client-safe); this module holds the server-only checks.
 *
 * `super_admin` has everything (and solely manages staff). `admin`/`editor` are
 * staff whose access is defined by per-resource checkbox permissions granted by
 * the super-admin. Enforcement is server-side on every protected route/action.
 */
export * from "./resources";

function emptyMap(value: boolean): PermissionMap {
  const map = {} as PermissionMap;
  for (const key of RESOURCE_KEYS) {
    map[key] = { view: value, edit: value, delete: value };
  }
  return map;
}

/** A user's effective permissions. super_admin gets everything. */
export async function getEffectivePermissions(
  userId: string,
  role: string,
): Promise<PermissionMap> {
  if (role === "super_admin") return emptyMap(true);
  if (role !== "admin" && role !== "editor") return emptyMap(false);

  const map = emptyMap(false);
  const staff = await prisma.staffMember.findUnique({
    where: { userId },
    select: {
      permissions: {
        select: {
          resource: true,
          canView: true,
          canEdit: true,
          canDelete: true,
        },
      },
    },
  });
  for (const p of staff?.permissions ?? []) {
    if ((RESOURCE_KEYS as string[]).includes(p.resource)) {
      map[p.resource as ResourceKey] = {
        view: p.canView,
        edit: p.canEdit,
        delete: p.canDelete,
      };
    }
  }
  return map;
}

/** Allows any staff (super_admin / admin / editor) into the admin area. */
export async function requireStaff() {
  const session = await auth();
  if (!session) redirect("/login");
  const { role } = session.user;
  if (role !== "super_admin" && role !== "admin" && role !== "editor") {
    redirect("/dashboard");
  }
  return session;
}

/** Requires a specific resource permission; redirects to /admin on deny. */
export async function requirePermission(
  resource: ResourceKey,
  action: PermissionAction,
) {
  const session = await requireStaff();
  if (session.user.role === "super_admin") return session;

  const perms = await getEffectivePermissions(
    session.user.id,
    session.user.role,
  );
  if (!perms[resource][action]) redirect("/admin");
  return session;
}
