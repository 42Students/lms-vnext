import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerCourseDrilldownLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Course progress"
        description="Retrieving records from your authorized course enrollment." />
      <LoadingState label="Loading course information…" />
    </div>
  );
}
