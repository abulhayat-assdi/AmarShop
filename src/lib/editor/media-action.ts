"use server";

import { auth } from "@/auth";
import { resolveEffectiveTenant } from "@/lib/auth/current-tenant";
import { PLATFORM_SCOPE, saveMedia } from "@/lib/storage/media";

/**
 * Uploads an image or video from inside the editor (spec §7.1).
 *
 * A tenant's media is stored under their own schema folder; staff editing a
 * master template (which belongs to no tenant) store under the shared
 * `platform` scope. Everything else — type allow-list, size cap, WebP
 * re-encoding — is enforced by the media store.
 */
export type MediaUploadResult =
  { ok: true; url: string } | { ok: false; error: string };

export async function uploadEditorMedia(
  formData: FormData,
): Promise<MediaUploadResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "You are not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const { tenant, role } = await resolveEffectiveTenant();
  const isStaff =
    role === "super_admin" || role === "admin" || role === "editor";
  const scope = tenant?.schema ?? (isStaff ? PLATFORM_SCOPE : null);
  if (!scope) {
    return { ok: false, error: "No place to store this upload." };
  }

  try {
    return { ok: true, url: await saveMedia(scope, file) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}
