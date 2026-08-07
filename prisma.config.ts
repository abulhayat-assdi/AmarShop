import path from "node:path";
// Prisma 7 does not auto-load .env for the config file; load it explicitly so
// CLI commands (migrate, db push, studio) can resolve DIRECT_URL. In Docker,
// where .env is absent, real environment variables are used instead.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // Direct connection (bypasses PgBouncer) used by Migrate / introspection.
    // The pooled runtime connection is configured on the driver adapter instead.
    url: env("DIRECT_URL"),
  },
});
