import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertValidSchemaName } from "@/lib/tenant/schema-sql";

/**
 * Self-hosted file storage on the VPS (spec §7.1).
 *
 * Images are written under `<UPLOAD_DIR>/<tenant_schema>/` and served by the
 * /uploads route. Sharp optimizes and converts every upload to WebP (spec §7.2),
 * which also strips any embedded scripts/metadata. `sharp` is imported lazily so
 * its native binary is only loaded at runtime.
 */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 1600;

export function uploadRoot(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

/**
 * Validates, optimizes (WebP, max 1600px), and stores an uploaded image for a
 * tenant. Returns the public URL path (`/uploads/<schema>/<file>.webp`).
 */
export async function saveTenantImage(
  schema: string,
  file: File,
): Promise<string> {
  assertValidSchemaName(schema);
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is too large (max 5 MB).");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const { default: sharp } = await import("sharp");
  const output = await sharp(input)
    .rotate() // honor EXIF orientation
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const dir = path.join(uploadRoot(), schema);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, filename), output);

  return `/uploads/${schema}/${filename}`;
}

/** Deletes a previously stored upload given its public URL path. Best-effort. */
export async function deleteTenantUpload(urlPath: string): Promise<void> {
  const relative = urlPath.replace(/^\/uploads\//, "");
  if (!relative || relative.includes("..")) return;
  const [schema, ...rest] = relative.split("/");
  try {
    assertValidSchemaName(schema);
  } catch {
    return;
  }
  if (rest.length === 0 || rest.some((s) => s.includes("..") || s === "")) {
    return;
  }
  await unlink(path.join(uploadRoot(), schema, ...rest)).catch(() => {});
}
