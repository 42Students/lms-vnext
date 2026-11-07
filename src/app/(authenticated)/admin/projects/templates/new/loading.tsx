import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <div className="min-w-0 space-y-4" aria-busy="true">
    <PageHeader title="Create project template" />
    <GracefulPageLoading shape="directory" label="Loading new project template…" />
  </div>;
}
