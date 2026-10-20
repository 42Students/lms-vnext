import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerPlacementCellLoading() {
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="Placement cell"
        description="Retrieving your official offers, requests and personal alerts." />
      <LoadingState label="Loading placement cell records…" />
    </div>
  );
}
