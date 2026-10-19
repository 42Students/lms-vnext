import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationsLoading() {
  return (
    <div className="space-y-5">
      <PageHeader title="Applications"
        description="Retrieving your current applications and verified outcomes." />
      <LoadingState label="Loading your applications…" />
    </div>
  );
}
