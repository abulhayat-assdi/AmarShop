import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

/**
 * Database seed (run via `npm run db:seed` or automatically by Prisma Migrate).
 *
 * Runs outside the Next.js runtime, so it builds its own Prisma client and loads
 * .env directly. Idempotent — safe to run repeatedly.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString }, { schema: "public" });
const prisma = new PrismaClient({ adapter });

// Subscription tiers (spec §6.4). Prices are placeholders until finalized (§13).
const PLANS = [
  { name: "Trial", price: 0, maxSites: 1 },
  { name: "Basic", price: 0, maxSites: 1 },
  { name: "Pro", price: 0, maxSites: 3 },
  { name: "Premium", price: 0, maxSites: 10 },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: { maxSites: plan.maxSites },
      create: {
        name: plan.name,
        price: plan.price,
        maxSites: plan.maxSites,
        features: {},
      },
    });
  }
  console.log(`Seeded ${PLANS.length} plans.`);

  // Bootstrap the super-admin from env (spec §6.6). Skipped if not configured.
  // Normalize the email to match how login canonicalizes it (lowercased),
  // otherwise an uppercase env value would lock the super-admin out.
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { role: "super_admin", passwordHash },
      create: { email, passwordHash, role: "super_admin" },
    });
    console.log(`Seeded super-admin: ${email}`);
  } else {
    console.warn(
      "SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super-admin seed.",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
