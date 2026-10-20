import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationSubpageLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Application status history"
        description="Checking your own persisted application."
      />
      <GracefulPageLoading label="Loading application status history…" shape="directory" />
    </div>
  );
}
