import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function CollegeSemestersLoading() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Semesters" />
    <GracefulPageLoading label="Loading semesters" shape="directory" />
  </div>;
}
