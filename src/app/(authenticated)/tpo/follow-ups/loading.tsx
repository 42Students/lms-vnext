import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function Loading() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Follow-ups due" />
  <GracefulPageLoading label="Loading follow-ups…" shape="directory" />
 </div>;
}
