import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function CollegeBrandingPreviewLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Setup"
        title="College branding preview"
        description="Retrieving the college's stored public presentation fields."
      />
      <LoadingState label="Loading branding preview…" />
    </div>
  );
}
