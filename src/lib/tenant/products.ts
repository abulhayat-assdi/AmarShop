import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "./schema-sql";

/**
 * Product data access for a tenant's schema (spec §6.3, §12).
 *
 * Tenant tables are not modeled by Prisma, so they are accessed with
 * schema-qualified raw SQL. The schema is always validated before interpolation
 * and only ever comes from the resolved tenant context (never user input);
 * all values are passed as bound parameters.
 */
export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  status: string;
  images: string[];
  createdAt: Date;
};

export type ProductInput = {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  status: string;
  images: string[];
};

const PRODUCT_COLUMNS = `id, name, description, price, stock, category, status, images, created_at AS "createdAt"`;

export async function listProducts(schema: string): Promise<Product[]> {
  assertValidSchemaName(schema);
  return prisma.$queryRawUnsafe<Product[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM "${schema}"."products" ORDER BY created_at DESC`,
  );
}

export async function getProduct(
  schema: string,
  id: string,
): Promise<Product | null> {
  assertValidSchemaName(schema);
  const rows = await prisma.$queryRawUnsafe<Product[]>(
    `SELECT ${PRODUCT_COLUMNS} FROM "${schema}"."products" WHERE id = $1 LIMIT 1`,
    id,
  );
  return rows[0] ?? null;
}

export async function createProduct(
  schema: string,
  input: ProductInput,
): Promise<void> {
  assertValidSchemaName(schema);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${schema}"."products"
       (id, name, description, price, stock, category, status, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    randomUUID(),
    input.name,
    input.description,
    input.price,
    input.stock,
    input.category,
    input.status,
    JSON.stringify(input.images),
  );
}

export async function updateProduct(
  schema: string,
  id: string,
  input: ProductInput,
): Promise<void> {
  assertValidSchemaName(schema);
  await prisma.$executeRawUnsafe(
    `UPDATE "${schema}"."products"
       SET name = $2, description = $3, price = $4, stock = $5,
           category = $6, status = $7, images = $8::jsonb, updated_at = now()
     WHERE id = $1`,
    id,
    input.name,
    input.description,
    input.price,
    input.stock,
    input.category,
    input.status,
    JSON.stringify(input.images),
  );
}

export async function deleteProduct(schema: string, id: string): Promise<void> {
  assertValidSchemaName(schema);
  await prisma.$executeRawUnsafe(
    `DELETE FROM "${schema}"."products" WHERE id = $1`,
    id,
  );
}

export async function setProductStock(
  schema: string,
  id: string,
  stock: number,
): Promise<void> {
  assertValidSchemaName(schema);
  await prisma.$executeRawUnsafe(
    `UPDATE "${schema}"."products" SET stock = $2, updated_at = now() WHERE id = $1`,
    id,
    stock,
  );
}

export type ProductStats = {
  total: number;
  totalStock: number;
  lowStock: number;
};

export async function getProductStats(schema: string): Promise<ProductStats> {
  assertValidSchemaName(schema);
  const rows = await prisma.$queryRawUnsafe<ProductStats[]>(
    `SELECT count(*)::int AS total,
            COALESCE(sum(stock), 0)::int AS "totalStock",
            (count(*) FILTER (WHERE stock <= 5))::int AS "lowStock"
     FROM "${schema}"."products"`,
  );
  return rows[0] ?? { total: 0, totalStock: 0, lowStock: 0 };
}
