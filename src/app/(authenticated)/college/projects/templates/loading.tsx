import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Project templates" description="Published project templates assigned to this college." />
    <GracefulPageLoading shape="directory" />
  </div>;
}
