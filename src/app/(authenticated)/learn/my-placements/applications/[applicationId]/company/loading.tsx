import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerApplicationSubpageLoading() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Employer details"
        description="Checking your own persisted application."
      />
      <GracefulPageLoading label="Loading employer details…" shape="directory" />
    </div>
  );
}
