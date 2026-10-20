import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
export default function CollegeProgramsLoading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Programs" description="Create, find and manage the programs in your college." />
    <GracefulPageLoading label="Loading college programs" shape="directory" />
  </div>;
}
