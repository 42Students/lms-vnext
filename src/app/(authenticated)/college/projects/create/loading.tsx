import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Create workspace" description="Choose the published template and learners for this workspace." />
    <GracefulPageLoading shape="directory" />
  </div>;
}
