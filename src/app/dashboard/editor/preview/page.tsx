import { ElementEditorPreview } from "@/components/editor/ElementEditorPreview";
import { requireTenantContext } from "@/lib/auth/current-tenant";

/**
 * Preview of the new element editor (spec §5.7).
 *
 * The element system is not yet wired to a tenant's stored site — that lands
 * with the template migration. This route exists so the editor can be used and
 * reviewed against real widgets in the meantime; work is kept in the browser,
 * not saved to the site.
 */
export default async function ElementEditorPreviewPage() {
  await requireTenantContext();
  return <ElementEditorPreview />;
}
