import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function CollegeBrandingPreviewLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Setup"
        title="College branding preview"
        description="Retrieving the college's stored public presentation fields."
      />
      <GracefulPageLoading label="Loading branding preview…" />
    </div>
  );
}
