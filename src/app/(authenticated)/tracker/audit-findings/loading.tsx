import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Audit findings" />
    <GracefulPageLoading label="Loading audit findings…" shape="directory" />
  </div>;
}
