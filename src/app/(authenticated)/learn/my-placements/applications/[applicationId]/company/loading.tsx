import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationSubpageLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Employer details"
        description="Checking your own persisted application."
      />
      <LoadingState label="Loading employer details…" />
    </div>
  );
}
