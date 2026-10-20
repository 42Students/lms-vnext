import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerAssessmentResultsLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Official assessment results"
        description="Retrieving applied assessment outcomes for your own applications." />
      <GracefulPageLoading label="Loading official assessment results…" shape="directory" />
    </div>
  );
}
