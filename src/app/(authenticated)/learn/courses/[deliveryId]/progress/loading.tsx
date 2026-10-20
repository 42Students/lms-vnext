import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerCourseDrilldownLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Course progress"
        description="Retrieving records from your authorized course enrollment." />
      <GracefulPageLoading label="Loading course information…" shape="directory" />
    </div>
  );
}
