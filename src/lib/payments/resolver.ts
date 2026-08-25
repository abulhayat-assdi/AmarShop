import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { prisma } from "@/lib/prisma";
import { assertValidSchemaName } from "@/lib/tenant/schema-sql";
import type { PaymentGateway } from "./gateway";
import {
  createBkashGateway,
  createSslcommerzGateway,
  manualGateway,
} from "./gateways";

function build(
  gateway: string,
  credentials: Record<string, string>,
): PaymentGateway {
  if (gateway === "bkash") return createBkashGateway(credentials);
  if (gateway === "sslcommerz") return createSslcommerzGateway(credentials);
  return manualGateway;
}

function fromEncrypted(
  gateway: string,
  encrypted: string | null,
): PaymentGateway | null {
  if (!encrypted) return null;
  try {
    return build(
      gateway,
      JSON.parse(decryptSecret(encrypted)) as Record<string, string>,
    );
  } catch {
    return null;
  }
}

async function tenantOwnGateway(
  schema: string,
): Promise<PaymentGateway | null> {
  assertValidSchemaName(schema);
  const rows = await prisma.$queryRawUnsafe<
    { gateway: string; encrypted_credentials: string | null }[]
  >(
    `SELECT gateway, encrypted_credentials
     FROM "${schema}"."payment_config" WHERE is_active = true LIMIT 1`,
  );
  const cfg = rows[0];
  return cfg ? fromEncrypted(cfg.gateway, cfg.encrypted_credentials) : null;
}

async function platformGateway(): Promise<PaymentGateway | null> {
  const platform = await prisma.platformGateway.findFirst({
    where: { isActive: true },
    select: { gateway: true, encryptedCredentials: true },
  });
  return platform
    ? fromEncrypted(platform.gateway, platform.encryptedCredentials)
    : null;
}

/**
 * Resolves the gateway a tenant's customer checkout should use (spec §6.2): the
 * tenant's own approved gateway, else the platform gateway, else manual.
 */
export async function resolveGatewayForTenant(tenant: {
  ownGatewayApproved: boolean;
  schemaName: string;
}): Promise<PaymentGateway> {
  if (tenant.ownGatewayApproved) {
    const own = await tenantOwnGateway(tenant.schemaName);
    if (own) return own;
  }
  return (await platformGateway()) ?? manualGateway;
}

/** Configures the platform's shared gateway; credentials are encrypted at rest. */
export async function setPlatformGateway(
  gateway: string,
  credentials: Record<string, string>,
): Promise<void> {
  const encryptedCredentials = encryptSecret(JSON.stringify(credentials));
  const existing = await prisma.platformGateway.findFirst({
    select: { id: true },
  });
  if (existing) {
    await prisma.platformGateway.update({
      where: { id: existing.id },
      data: { gateway, encryptedCredentials, isActive: true },
    });
  } else {
    await prisma.platformGateway.create({
      data: { gateway, encryptedCredentials, isActive: true },
    });
  }
}

export async function getPlatformGatewayInfo() {
  return prisma.platformGateway.findFirst({
    select: { gateway: true, isActive: true, updatedAt: true },
  });
}
