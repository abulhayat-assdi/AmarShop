import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma client singleton (Prisma 7, driver-adapter based).
 *
 * The `@prisma/adapter-pg` adapter owns a `pg` connection pool that talks to
 * PostgreSQL through PgBouncer (DATABASE_URL). Using a driver adapter (rather
 * than the legacy query engine) gives us direct control over the pool and the
 * active schema — which the schema-per-tenant layer relies on in later modules.
 *
 * In development, Next.js hot-reloading would otherwise create a new client on
 * every reload and exhaust connections, so we cache the instance on `globalThis`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // The adapter's `schema` option selects the schema used in generated queries.
  // Module 1 targets `public`; the tenant-aware layer passes a `tenant_<x>`
  // schema per request in a later module.
  const adapter = new PrismaPg(
    { connectionString: env.DATABASE_URL },
    { schema: "public" },
  );

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
