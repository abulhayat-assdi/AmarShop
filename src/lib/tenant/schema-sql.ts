/**
 * DDL for a tenant's dedicated PostgreSQL schema (spec §4, §12).
 *
 * In the schema-per-tenant model each tenant owns a `tenant_<x>` schema. Prisma
 * manages only the `public` schema, so these tenant tables are created by the
 * custom SQL runner in ./provision.ts rather than by Prisma Migrate.
 *
 * `TENANT_SCHEMA_VERSION` lets a later module evolve tenant schemas across all
 * tenants at once (the migration runner the spec describes in §4.4).
 */

export const TENANT_SCHEMA_VERSION = 1;

// Schema names are interpolated into DDL (identifiers cannot be parameterized),
// so they are strictly validated to a safe shape to prevent SQL injection.
const SCHEMA_NAME_PATTERN = /^tenant_[a-z0-9_]+$/;

/** Throws if `schema` is not a safe tenant schema identifier. */
export function assertValidSchemaName(schema: string): void {
  // 63 is PostgreSQL's identifier length limit.
  if (schema.length > 63 || !SCHEMA_NAME_PATTERN.test(schema)) {
    throw new Error(`Invalid tenant schema name: "${schema}"`);
  }
}

/**
 * Returns the ordered DDL statements that create a tenant's schema and its
 * tables. Idempotent (`IF NOT EXISTS`) so it is safe to re-run.
 */
export function tenantSchemaStatements(schema: string): string[] {
  assertValidSchemaName(schema);
  const s = `"${schema}"`;

  return [
    `CREATE SCHEMA IF NOT EXISTS ${s}`,

    // The live, editable structure of the tenant's site (deep copy of a
    // template's blocks + theme). One row per site (spec §5.6).
    `CREATE TABLE IF NOT EXISTS ${s}."site_config" (
      "id" TEXT PRIMARY KEY,
      "template_id" TEXT,
      "blocks_json" JSONB NOT NULL DEFAULT '[]',
      "theme_json" JSONB NOT NULL DEFAULT '{}',
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS ${s}."products" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "price" INTEGER NOT NULL DEFAULT 0,
      "stock" INTEGER NOT NULL DEFAULT 0,
      "images" JSONB NOT NULL DEFAULT '[]',
      "category" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS ${s}."customers" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "phone" TEXT,
      "email" TEXT,
      "address" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS ${s}."orders" (
      "id" TEXT PRIMARY KEY,
      "customer_id" TEXT REFERENCES ${s}."customers"("id") ON DELETE SET NULL,
      "items_json" JSONB NOT NULL DEFAULT '[]',
      "total" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "payment_status" TEXT NOT NULL DEFAULT 'unpaid',
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS ${s}."inventory" (
      "id" TEXT PRIMARY KEY,
      "product_id" TEXT REFERENCES ${s}."products"("id") ON DELETE CASCADE,
      "quantity" INTEGER NOT NULL DEFAULT 0,
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,

    // High-filter columns benefit from indexes (spec §7.2).
    `CREATE INDEX IF NOT EXISTS "products_status_idx" ON ${s}."products" ("status")`,
    `CREATE INDEX IF NOT EXISTS "products_category_idx" ON ${s}."products" ("category")`,
    `CREATE INDEX IF NOT EXISTS "orders_status_idx" ON ${s}."orders" ("status")`,
    `CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON ${s}."orders" ("created_at")`,
  ];
}
