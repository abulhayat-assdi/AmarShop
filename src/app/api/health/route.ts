import { NextResponse } from "next/server";

// Always evaluate at request time so uptime checks reflect live status.
export const dynamic = "force-dynamic";

/**
 * Liveness probe for uptime monitoring (spec §7.2).
 *
 * Intentionally does not touch the database. A separate readiness check that
 * verifies DB/Redis connectivity is added once those models/clients exist.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "amarshop",
    timestamp: new Date().toISOString(),
  });
}
