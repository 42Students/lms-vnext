import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="My reports" description="See the issues you have reported." />
    <GracefulPageLoading label="Loading my reports…" shape="directory" />
  </div>;
}
