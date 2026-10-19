import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerOffersLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="My offers"
        description="Retrieving your official offers and recorded joining outcomes."
      />
      <LoadingState label="Loading your offers…" />
    </div>
  );
}
