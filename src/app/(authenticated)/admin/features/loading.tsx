import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function SuperAdminFeaturesLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Controls"
        title="Feature Controls"
        description="Reading persisted college module access rules."
      />
      <LoadingState label="Loading college feature matrix…" />
    </div>
  );
}
