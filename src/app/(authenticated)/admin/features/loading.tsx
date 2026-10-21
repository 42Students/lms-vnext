import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminFeaturesLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Controls"
        title="Feature Controls"
        description="Reading persisted college module access rules."
      />
      <GracefulPageLoading label="Loading college feature matrix…" shape="directory" />
    </div>
  );
}
