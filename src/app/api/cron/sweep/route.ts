import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sweepSubscriptions } from "@/lib/billing/subscriptions";

// Runs the subscription grace/suspend sweep (spec §6.4). Node runtime for
// Prisma; never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Cron-triggered billing sweep. Guarded by CRON_SECRET (Bearer). Call from the
 * VPS crontab, e.g. daily:
 *   0 3 * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     https://amarshop.com/api/cron/sweep
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Cron is not configured (CRON_SECRET unset)." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!safeEqual(authorization, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sweepSubscriptions();
  return NextResponse.json({ ok: true, ...result });
}
