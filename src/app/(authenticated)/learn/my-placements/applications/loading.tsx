import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationsLoading() {
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Applications"
        description="Retrieving your current applications and verified outcomes." />
      <GracefulPageLoading label="Loading your applications…" shape="directory" />
    </div>
  );
}
