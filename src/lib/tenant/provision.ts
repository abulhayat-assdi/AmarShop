import { Client } from "pg";
import { env } from "@/lib/env";
import { assertValidSchemaName, tenantSchemaStatements } from "./schema-sql";

/**
 * Creates a tenant's PostgreSQL schema and tables (spec §4.2, step 2–3).
 *
 * Uses a direct connection (DIRECT_URL, bypassing PgBouncer) because DDL and
 * schema creation should not go through the transaction pooler. PostgreSQL runs
 * DDL transactionally, so a failure rolls back cleanly leaving no half-built
 * schema.
 */
export async function provisionTenantSchema(schema: string): Promise<void> {
  assertValidSchemaName(schema);

  const client = new Client({ connectionString: env.DIRECT_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const statement of tenantSchemaStatements(schema)) {
      await client.query(statement);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Drops a tenant's schema and all its data. Used to roll back a failed sign-up
 * and (later) when a super-admin deletes a tenant.
 */
export async function dropTenantSchema(schema: string): Promise<void> {
  assertValidSchemaName(schema);

  const client = new Client({ connectionString: env.DIRECT_URL });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
}
