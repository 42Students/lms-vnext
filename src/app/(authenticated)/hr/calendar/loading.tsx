import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <div className="min-w-0 space-y-4"><PageHeader title="Calendar" /><GracefulPageLoading label="Loading recruiter calendar…" shape="card" /></div>;
}
