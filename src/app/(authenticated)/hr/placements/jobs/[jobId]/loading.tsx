import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function HrJobLoading() {
  return <div className="min-w-0 space-y-4"><PageHeader title="Hiring drive" /><GracefulPageLoading label="Loading hiring job" shape="directory" /></div>;
}
