import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Actor and entity audit" />
    <GracefulPageLoading label="Loading actor audit…" shape="directory" />
  </div>;
}
