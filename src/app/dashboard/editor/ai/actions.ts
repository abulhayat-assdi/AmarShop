"use server";

import { revalidatePath } from "next/cache";
import { applyAiEdit } from "@/lib/ai/editor";
import type { AiEditState } from "@/lib/ai/types";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import {
  getSiteConfigBlocks,
  updateSiteBlocks,
} from "@/lib/tenant/site-config";

export async function aiEditAction(
  _prev: AiEditState,
  formData: FormData,
): Promise<AiEditState> {
  const { schema } = await requireTenantContext();
  const instruction = String(formData.get("instruction") ?? "").trim();
  if (!instruction) return { error: "Please describe the change you want." };

  try {
    const current = await getSiteConfigBlocks(schema);
    const blocks = await applyAiEdit(current, instruction);
    await updateSiteBlocks(schema, blocks);
    revalidatePath("/dashboard/editor");
    revalidatePath("/dashboard/editor/ai");
    return {
      ok: true,
      message: `Applied — your site now has ${blocks.length} block(s).`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "AI edit failed.",
    };
  }
}
