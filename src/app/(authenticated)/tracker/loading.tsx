import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="What went wrong?" description="Report an LMS issue · Pick the context, describe the problem, and submit." />
    <GracefulPageLoading label="Preparing issue report…" shape="directory" />
  </div>;
}
