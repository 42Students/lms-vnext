import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return <div className="min-w-0 space-y-6"><PageHeader title="Faculty" /><GracefulPageLoading label="Loading college faculty…" shape="directory" /></div>;
}
