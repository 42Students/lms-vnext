import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerPlacementRulesLoading() {
  return (
    <div className="space-y-5">
      <PageHeader title="Placement rules"
        description="Retrieving your current academic evidence and placement preferences." />
      <LoadingState label="Loading your placement preparation…" />
    </div>
  );
}
