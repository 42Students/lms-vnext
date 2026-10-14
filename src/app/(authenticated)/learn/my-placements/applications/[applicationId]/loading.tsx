import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationDetailLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Placements"
        title="Application information"
        description="Checking your own placement application."
      />
      <LoadingState label="Loading application details…" />
    </div>
  );
}
