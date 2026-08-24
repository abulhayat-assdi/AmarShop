import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "./schema-sql";

/**
 * Storefront checkout for a tenant's schema (spec §6). Prices are read from the
 * database (never trusted from the client), the order + customer are created,
 * and stock is decremented — all in one transaction.
 */
export type CartLine = { productId: string; qty: number };

export type CheckoutInput = {
  customerName: string;
  phone: string;
  address: string;
  email: string | null;
  items: CartLine[];
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  lineTotal: number;
};

export async function placeOrder(
  schema: string,
  input: CheckoutInput,
): Promise<{ orderId: string; total: number }> {
  assertValidSchemaName(schema);

  const ids = [...new Set(input.items.map((i) => i.productId))];
  if (ids.length === 0) throw new Error("Your cart is empty.");

  const products = await prisma.$queryRawUnsafe<
    { id: string; name: string; price: number }[]
  >(
    `SELECT id, name, price FROM "${schema}"."products"
     WHERE id = ANY($1::text[]) AND status = 'active'`,
    ids,
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  const orderItems: OrderItem[] = [];
  for (const line of input.items) {
    const product = byId.get(line.productId);
    const qty = Math.max(1, Math.floor(line.qty));
    if (!product) continue;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty,
      lineTotal: product.price * qty,
    });
  }
  if (orderItems.length === 0) {
    throw new Error("None of the cart items are available.");
  }
  const total = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

  const orderId = randomUUID();
  const customerId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO "${schema}"."customers" (id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)`,
      customerId,
      input.customerName,
      input.phone,
      input.email,
      input.address,
    );
    await tx.$executeRawUnsafe(
      `INSERT INTO "${schema}"."orders"
         (id, customer_id, items_json, total, status, payment_status)
       VALUES ($1, $2, $3::jsonb, $4, 'pending', 'unpaid')`,
      orderId,
      customerId,
      JSON.stringify(orderItems),
      total,
    );
    for (const item of orderItems) {
      await tx.$executeRawUnsafe(
        `UPDATE "${schema}"."products"
         SET stock = GREATEST(stock - $2, 0), updated_at = now() WHERE id = $1`,
        item.productId,
        item.qty,
      );
    }
  });

  return { orderId, total };
}

export type OrderDetail = {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;
  customerName: string | null;
  phone: string | null;
  createdAt: Date;
};

export async function getOrder(
  schema: string,
  id: string,
): Promise<OrderDetail | null> {
  assertValidSchemaName(schema);
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      items_json: OrderItem[];
      total: number;
      status: string;
      payment_status: string;
      customer_name: string | null;
      phone: string | null;
      created_at: Date;
    }[]
  >(
    `SELECT o.id, o.items_json, o.total, o.status, o.payment_status,
            c.name AS customer_name, c.phone, o.created_at
     FROM "${schema}"."orders" o
     LEFT JOIN "${schema}"."customers" c ON c.id = o.customer_id
     WHERE o.id = $1 LIMIT 1`,
    id,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    items: row.items_json ?? [],
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    customerName: row.customer_name,
    phone: row.phone,
    createdAt: row.created_at,
  };
}
