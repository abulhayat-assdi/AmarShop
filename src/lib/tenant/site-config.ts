import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "./schema-sql";

/**
 * Tenant `site_config` access (spec §5.6, §12).
 *
 * `site_config` lives in the tenant's own schema (not modeled by Prisma), so it
 * is read/written with schema-qualified raw SQL. There is one site per tenant,
 * so a fixed row id is used. The schema name is always validated before it is
 * interpolated (it never comes from user input — only from the resolved tenant).
 */
const SITE_CONFIG_ID = "default";

/** Returns the tenant's block list (its live site), or null if not set up yet. */
export async function getSiteConfigBlocks(
  schemaName: string,
): Promise<unknown> {
  assertValidSchemaName(schemaName);
  const rows = await prisma.$queryRawUnsafe<{ blocks_json: unknown }[]>(
    `SELECT blocks_json FROM "${schemaName}"."site_config" WHERE id = $1 LIMIT 1`,
    SITE_CONFIG_ID,
  );
  return rows[0]?.blocks_json ?? null;
}

/**
 * Writes the tenant's live site (a deep copy of a template's blocks). Upserts
 * the single site_config row.
 */
export async function setSiteConfig(
  schemaName: string,
  templateId: string,
  blocks: unknown,
): Promise<void> {
  assertValidSchemaName(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${schemaName}"."site_config" (id, template_id, blocks_json, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET template_id = EXCLUDED.template_id,
           blocks_json = EXCLUDED.blocks_json,
           updated_at = now()`,
    SITE_CONFIG_ID,
    templateId,
    JSON.stringify(blocks),
  );
}

/**
 * Updates only the tenant's block list (from the editor, spec §5.7), preserving
 * the linked template_id.
 */
export async function updateSiteBlocks(
  schemaName: string,
  blocks: unknown,
): Promise<void> {
  assertValidSchemaName(schemaName);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${schemaName}"."site_config" (id, blocks_json, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (id) DO UPDATE
       SET blocks_json = EXCLUDED.blocks_json,
           updated_at = now()`,
    SITE_CONFIG_ID,
    JSON.stringify(blocks),
  );
}
