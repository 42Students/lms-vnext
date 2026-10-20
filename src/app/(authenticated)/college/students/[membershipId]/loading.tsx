import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function LoadingStudentDetail() {
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Student record" />
    <GracefulPageLoading label="Loading student record" shape="directory" />
  </div>;
}
