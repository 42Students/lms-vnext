import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerAssessmentResultsLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Official assessment results"
        description="Retrieving applied assessment outcomes for your own applications." />
      <LoadingState label="Loading official assessment results…" />
    </div>
  );
}
