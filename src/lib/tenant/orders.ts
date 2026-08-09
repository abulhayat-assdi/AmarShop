import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "./schema-sql";

/**
 * Order data access for a tenant's schema (spec §6.3, §12).
 *
 * Orders are created by the storefront checkout (Phase 2); this module gives the
 * owner basic order tracking now — a list and status updates.
 */
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  customerId: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
};

export async function listOrders(schema: string): Promise<Order[]> {
  assertValidSchemaName(schema);
  return prisma.$queryRawUnsafe<Order[]>(
    `SELECT id,
            customer_id AS "customerId",
            total,
            status,
            payment_status AS "paymentStatus",
            created_at AS "createdAt"
     FROM "${schema}"."orders"
     ORDER BY created_at DESC`,
  );
}

export async function updateOrderStatus(
  schema: string,
  id: string,
  status: OrderStatus,
): Promise<void> {
  assertValidSchemaName(schema);
  await prisma.$executeRawUnsafe(
    `UPDATE "${schema}"."orders" SET status = $2 WHERE id = $1`,
    id,
    status,
  );
}

export type OrderStats = {
  total: number;
  revenue: number;
  pending: number;
};

export async function getOrderStats(schema: string): Promise<OrderStats> {
  assertValidSchemaName(schema);
  const rows = await prisma.$queryRawUnsafe<OrderStats[]>(
    `SELECT count(*)::int AS total,
            COALESCE(sum(total) FILTER (WHERE payment_status = 'paid'), 0)::int AS revenue,
            (count(*) FILTER (WHERE status = 'pending'))::int AS pending
     FROM "${schema}"."orders"`,
  );
  return rows[0] ?? { total: 0, revenue: 0, pending: 0 };
}
