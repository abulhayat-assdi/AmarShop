import { z } from "zod";

/**
 * Runtime environment variable validation.
 *
 * Importing `env` from this module guarantees the required variables are
 * present and well-formed, failing fast with a readable error otherwise.
 * Add new variables here as modules need them.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database (PostgreSQL). Connection strings are validated as non-empty
  // rather than strict URLs, since Prisma connection strings carry extra
  // query parameters (e.g. `?pgbouncer=true`).
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

  // Redis (cache + BullMQ). Optional until wired up in a later module.
  REDIS_URL: z.string().min(1).optional(),

  // Application URLs.
  APP_URL: z.string().min(1).optional(),
  ROOT_DOMAIN: z.string().min(1).default("localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
