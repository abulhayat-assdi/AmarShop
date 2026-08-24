import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "./schema-sql";

/**
 * Public storefront reads from a tenant's schema (spec §6 e-commerce). Only
 * `active` products are shown to customers. Prices/stock are always read from
 * the database — never trusted from the client — so checkout totals are
 * server-authoritative.
 */
export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  images: string[];
};

const COLUMNS = `id, name, description, price, stock, category, images`;

export async function listActiveProducts(
  schema: string,
): Promise<StorefrontProduct[]> {
  assertValidSchemaName(schema);
  return prisma.$queryRawUnsafe<StorefrontProduct[]>(
    `SELECT ${COLUMNS} FROM "${schema}"."products"
     WHERE status = 'active' ORDER BY created_at DESC`,
  );
}

export async function getStorefrontProduct(
  schema: string,
  id: string,
): Promise<StorefrontProduct | null> {
  assertValidSchemaName(schema);
  const rows = await prisma.$queryRawUnsafe<StorefrontProduct[]>(
    `SELECT ${COLUMNS} FROM "${schema}"."products"
     WHERE id = $1 AND status = 'active' LIMIT 1`,
    id,
  );
  return rows[0] ?? null;
}
