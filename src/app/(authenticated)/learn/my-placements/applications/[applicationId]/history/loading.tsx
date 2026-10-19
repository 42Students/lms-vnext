import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationSubpageLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Application status history"
        description="Checking your own persisted application."
      />
      <LoadingState label="Loading application status history…" />
    </div>
  );
}
