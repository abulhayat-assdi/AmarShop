/**
 * Subdomain + tenant-schema naming helpers.
 *
 * A tenant is reached at `<subdomain>.<ROOT_DOMAIN>` (spec §6.1) and its data
 * lives in the `tenant_<subdomain>` PostgreSQL schema.
 */

// Subdomains that must never be handed to a tenant (platform-reserved).
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "superadmin",
  "super-admin",
  "dashboard",
  "auth",
  "login",
  "signup",
  "static",
  "assets",
  "cdn",
  "mail",
  "smtp",
  "ftp",
  "status",
  "help",
  "support",
  "blog",
  "docs",
]);

/** Converts a free-text shop name into a candidate subdomain slug. */
export function slugifySubdomain(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics become hyphens
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 40);
}

/** A valid subdomain: 3–40 chars, lowercase alphanumerics and single hyphens. */
export function isValidSubdomain(subdomain: string): boolean {
  return (
    subdomain.length >= 3 &&
    subdomain.length <= 40 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)
  );
}

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.has(subdomain);
}

/** Maps a subdomain to its PostgreSQL schema name (`tenant_<subdomain>`). */
export function schemaNameForSubdomain(subdomain: string): string {
  return `tenant_${subdomain.replace(/-/g, "_")}`;
}
