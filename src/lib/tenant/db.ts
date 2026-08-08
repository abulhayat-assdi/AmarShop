import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "./schema-sql";

/**
 * Tenant-schema data access.
 *
 * Tenant tables live in `tenant_<x>` schemas that Prisma does not model, so they
 * are read with schema-qualified raw SQL. The schema name is always validated
 * before it is interpolated (it can never come from user input directly — it is
 * derived from the host-resolved tenant), which prevents SQL injection.
 *
 * Full tenant CRUD arrives with the admin panel (Module 5); this helper exists
 * so Module 3 can prove that a request is scoped to exactly one tenant's schema.
 */
export async function countTenantProducts(schemaName: string): Promise<number> {
  assertValidSchemaName(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT count(*)::int AS count FROM "${schemaName}"."products"`,
  );
  return rows[0]?.count ?? 0;
}
