import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadRoot } from "@/lib/storage/local";
import { assertValidSchemaName } from "@/lib/tenant/schema-sql";

// Reads files from the VPS disk (spec §7.1); Node runtime for fs access.
export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

/**
 * Serves self-hosted uploads at /uploads/<schema>/<file>. Public assets
 * (product images), so no auth. Path segments are strictly validated to prevent
 * directory traversal. A Cloudflare proxy can cache in front (spec §7.1).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments || segments.length < 2) {
    return new NextResponse(null, { status: 404 });
  }

  const [schema, ...rest] = segments;
  try {
    assertValidSchemaName(schema);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (rest.some((s) => !s || s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = path.join(uploadRoot(), schema, ...rest);
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
