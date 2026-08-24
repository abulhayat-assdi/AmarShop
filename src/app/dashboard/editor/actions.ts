"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { parseBlocks } from "@/lib/blocks/schemas";
import { updateSiteBlocks } from "@/lib/tenant/site-config";

/**
 * Persists the edited site (spec §5.7). The blocks are re-validated server-side
 * against the block schemas — only valid, bounded blocks are stored, so the
 * editor can never write raw or malformed content (spec §1.4).
 */
export async function saveSiteBlocks(blocks: unknown) {
  const { schema } = await requireTenantContext();
  const valid = parseBlocks(blocks);
  await updateSiteBlocks(schema, valid);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/editor");
}
