import { SiteEditor } from "@/components/editor/SiteEditor";
import { isAiConfigured } from "@/lib/ai/config";
import { requireTenantContext } from "@/lib/auth/current-tenant";
import { blocksToPuckData } from "@/lib/editor/mapping";
import { getSiteConfigBlocks } from "@/lib/tenant/site-config";
import { saveSiteBlocks } from "./actions";

export default async function EditorPage() {
  const { schema } = await requireTenantContext();
  const blocks = await getSiteConfigBlocks(schema);
  const initialData = blocksToPuckData(blocks);

  return (
    <SiteEditor
      initialData={initialData}
      onSave={saveSiteBlocks}
      aiConfigured={isAiConfigured()}
    />
  );
}
