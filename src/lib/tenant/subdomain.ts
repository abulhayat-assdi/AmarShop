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

/** The platform's root domain (e.g. "amarshop.com", or "localhost:3000" in dev). */
export function getRootDomain(): string {
  return process.env.ROOT_DOMAIN ?? "localhost:3000";
}

/**
 * Extracts the tenant subdomain from a request Host header, or null when the
 * request targets the platform itself (the root domain, `www`, or a reserved
 * name). Custom domains — hosts not under the root domain — also return null;
 * they are resolved separately (spec §6.1, Phase 3). Edge-safe (no I/O).
 */
export function getSubdomainFromHost(
  host: string | null | undefined,
  rootDomain: string,
): string | null {
  if (!host) return null;
  const h = host.toLowerCase().trim();
  const root = rootDomain.toLowerCase().trim();

  if (h === root || h === `www.${root}`) return null;
  if (!h.endsWith(`.${root}`)) return null; // custom / unknown domain

  const sub = h.slice(0, h.length - root.length - 1);
  if (!sub || sub.includes("/") || isReservedSubdomain(sub)) return null;
  return sub;
}
