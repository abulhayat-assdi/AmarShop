import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dropTenantSchema, provisionTenantSchema } from "@/lib/tenant/provision";
import {
  isReservedSubdomain,
  isValidSubdomain,
  schemaNameForSubdomain,
  slugifySubdomain,
} from "@/lib/tenant/subdomain";
import { signupSchema } from "@/lib/validation/auth";

// pg + Prisma require the Node.js runtime (not Edge).
export const runtime = "nodejs";

/**
 * Sign-up + tenant provisioning (spec §4.2).
 *
 * Creates the owner user and tenant row (in one transaction), then provisions
 * the tenant's dedicated schema. If provisioning fails, the just-created rows
 * are rolled back so a half-created account is never left behind.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email, password, shopName, siteType } = parsed.data;

  const subdomain = slugifySubdomain(shopName);
  if (!isValidSubdomain(subdomain) || isReservedSubdomain(subdomain)) {
    return NextResponse.json(
      {
        error:
          "Could not derive a valid subdomain from the shop name. Please choose a different name.",
      },
      { status: 400 },
    );
  }
  const schemaName = schemaNameForSubdomain(subdomain);

  // Uniqueness checks (also enforced by DB constraints as a backstop).
  const [emailTaken, subdomainTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.tenant.findUnique({ where: { subdomain }, select: { id: true } }),
  ]);
  if (emailTaken) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }
  if (subdomainTaken) {
    return NextResponse.json(
      { error: `The address "${subdomain}" is taken. Please choose a different shop name.` },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);
  // New tenants start on the free trial plan (created by the seed).
  const trialPlan = await prisma.plan.findUnique({
    where: { name: "Trial" },
    select: { id: true },
  });

  // Create the tenant + owner user atomically. A unique-constraint violation
  // here means a concurrent sign-up won the race between our checks and this
  // insert — surface it as a conflict rather than a 500.
  let tenant;
  try {
    tenant = await prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: shopName,
          subdomain,
          schemaName,
          siteType,
          status: "trial",
          planId: trialPlan?.id ?? null,
        },
      });
      await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "user",
          tenantId: createdTenant.id,
        },
      });
      return createdTenant;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This email or shop address was just taken. Please try again." },
        { status: 409 },
      );
    }
    throw error;
  }

  // Provision the tenant schema outside the transaction (DDL on a direct
  // connection). Roll back BOTH rows if it fails, otherwise the owner user is
  // orphaned (the tenant FK is ON DELETE SET NULL).
  try {
    await provisionTenantSchema(schemaName);
  } catch (error) {
    console.error("Tenant schema provisioning failed:", error);
    // Best-effort rollback of the committed rows + schema. Log (do not swallow)
    // any cleanup failure so an orphaned tenant/user can be reconciled.
    await prisma.user
      .deleteMany({ where: { tenantId: tenant.id } })
      .catch((e) => console.error("Rollback: failed to delete owner user:", e));
    await prisma.tenant
      .delete({ where: { id: tenant.id } })
      .catch((e) => console.error("Rollback: failed to delete tenant:", e));
    await dropTenantSchema(schemaName).catch((e) =>
      console.error("Rollback: failed to drop tenant schema:", e),
    );
    return NextResponse.json(
      { error: "Failed to provision your site. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, tenant: { subdomain, siteType } },
    { status: 201 },
  );
}
