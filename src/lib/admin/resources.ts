/**
 * Pure RBAC resource/action definitions (no server imports), so they can be
 * used from both client and server components (spec §6.7).
 */
export const RESOURCES = [
  { key: "tenants", label: "Tenants" },
  { key: "templates", label: "Templates" },
  { key: "audit", label: "Audit log" },
] as const;
export type ResourceKey = (typeof RESOURCES)[number]["key"];
export const RESOURCE_KEYS = RESOURCES.map((r) => r.key) as ResourceKey[];

export const PERMISSION_ACTIONS = ["view", "edit", "delete"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type ResourcePermissions = Record<PermissionAction, boolean>;
export type PermissionMap = Record<ResourceKey, ResourcePermissions>;
