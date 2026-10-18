import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function CollegeReadinessLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Tenant Setup"
        title="College Readiness Gate"
        description="Checking persisted college setup evidence."
      />
      <GracefulPageLoading label="Evaluating college readiness…" />
    </div>
  );
}
