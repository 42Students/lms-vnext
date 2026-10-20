import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Profile" description="Manage your recruiter details." />
    <GracefulPageLoading label="Loading recruiter profile…" shape="directory" />
  </div>;
}
