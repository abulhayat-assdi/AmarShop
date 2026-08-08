import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
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

type TemplateFile = {
  name: string;
  slug: string;
  category: string;
  siteType: Prisma.TemplateCreateInput["siteType"];
  blocks: Prisma.InputJsonValue;
};

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

  // Master templates from the templates/ folder (spec §5.5). structureJson holds
  // the blocks array that is deep-copied into a tenant's site_config on select.
  const templatesDir = join(process.cwd(), "templates");
  if (existsSync(templatesDir)) {
    let count = 0;
    for (const dir of readdirSync(templatesDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const file = join(templatesDir, dir.name, "template.json");
      if (!existsSync(file)) continue;

      const tpl = JSON.parse(readFileSync(file, "utf8")) as TemplateFile;
      await prisma.template.upsert({
        where: { slug: tpl.slug },
        update: {
          name: tpl.name,
          category: tpl.category,
          siteType: tpl.siteType,
          structureJson: tpl.blocks,
          isActive: true,
        },
        create: {
          name: tpl.name,
          slug: tpl.slug,
          category: tpl.category,
          siteType: tpl.siteType,
          structureJson: tpl.blocks,
        },
      });
      count++;
    }
    console.log(`Seeded ${count} templates.`);
  }

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
