import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Records an admin action in the audit trail (spec §6.7, §8). */
export async function logAudit(params: {
  actorUserId: string;
  action: string;
  resource: string;
  targetId?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      resource: params.resource,
      targetId: params.targetId ?? null,
      meta: params.meta ?? {},
    },
  });
}

export async function listAuditLog(limit = 100) {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      actorUserId: true,
      action: true,
      resource: true,
      targetId: true,
      createdAt: true,
    },
  });

  // Resolve actor emails (actor_user_id has no FK, so join in app code).
  const actorIds = [
    ...new Set(entries.map((e) => e.actorUserId).filter(Boolean)),
  ] as string[];
  const users = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return entries.map((e) => ({
    ...e,
    actorEmail: e.actorUserId
      ? (emailById.get(e.actorUserId) ?? "—")
      : "system",
  }));
}
