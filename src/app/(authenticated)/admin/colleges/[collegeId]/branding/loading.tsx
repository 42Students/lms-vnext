import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function CollegeBrandingPreviewLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Setup"
        title="Look and feel"
        description="Retrieving the college's stored public presentation fields."
      />
      <GracefulPageLoading label="Loading college branding…" shape="form" />
    </div>
  );
}
