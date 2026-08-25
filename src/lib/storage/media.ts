import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadRoot } from "./local";

/**
 * Media storage for the editor (spec §7.1).
 *
 * Extends the tenant image store with two things the element editor needs:
 * video uploads, and a `platform` scope for media used by master templates,
 * which belong to no tenant. Scopes are validated here rather than with
 * `assertValidSchemaName`, because that validator guards SQL identifiers and
 * must stay strict about the `tenant_` prefix.
 */
const SCOPE_PATTERN = /^(tenant_[a-z0-9_]+|platform)$/;

export const PLATFORM_SCOPE = "platform";

export function assertValidMediaScope(scope: string): void {
  if (scope.length > 63 || !SCOPE_PATTERN.test(scope)) {
    throw new Error(`Invalid media scope: "${scope}"`);
  }
}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const VIDEO_TYPES = new Map([
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_DIMENSION = 1600;

export type MediaKind = "image" | "video";

export function mediaKindOf(type: string): MediaKind | null {
  if (IMAGE_TYPES.has(type)) return "image";
  if (VIDEO_TYPES.has(type)) return "video";
  return null;
}

/**
 * Stores an uploaded file and returns its public URL path.
 *
 * Images are re-encoded to WebP by Sharp, which also strips embedded metadata
 * and any script payload hidden in the original container. Videos are stored
 * verbatim (re-encoding needs ffmpeg, which the VPS image does not carry), so
 * only the two safe container types above are accepted and the file is served
 * with a fixed Content-Type — never sniffed.
 */
export async function saveMedia(scope: string, file: File): Promise<string> {
  assertValidMediaScope(scope);

  const kind = mediaKindOf(file.type);
  if (!kind) {
    throw new Error(
      "Unsupported file type. Use JPEG, PNG, WebP, GIF or AVIF images, or MP4/WebM video.",
    );
  }

  const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > limit) {
    throw new Error(
      `File is too large (max ${Math.round(limit / (1024 * 1024))} MB).`,
    );
  }

  const dir = path.join(uploadRoot(), scope);
  await mkdir(dir, { recursive: true });

  if (kind === "video") {
    const extension = VIDEO_TYPES.get(file.type)!;
    const filename = `${randomUUID()}${extension}`;
    await writeFile(
      path.join(dir, filename),
      Buffer.from(await file.arrayBuffer()),
    );
    return `/uploads/${scope}/${filename}`;
  }

  const input = Buffer.from(await file.arrayBuffer());
  const { default: sharp } = await import("sharp");
  const output = await sharp(input)
    .rotate() // honour EXIF orientation
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(dir, filename), output);
  return `/uploads/${scope}/${filename}`;
}
