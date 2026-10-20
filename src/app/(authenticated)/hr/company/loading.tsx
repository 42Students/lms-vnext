import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <div className="min-w-0 space-y-4"><PageHeader title="Company & Team" /><GracefulPageLoading label="Loading company…" shape="directory" /></div>;
}
