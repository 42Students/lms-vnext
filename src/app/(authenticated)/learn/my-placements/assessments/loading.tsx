import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerAssessmentsLoading() {
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Assessments"
        description="Loading your own scheduled employer assessments." />
      <GracefulPageLoading label="Loading assessment schedule and due buckets…" shape="directory" />
    </div>
  );
}
