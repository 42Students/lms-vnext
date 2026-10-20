import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function LearnerCalendarLoading() {
  return <div className="min-w-0 space-y-6"><PageHeader title="Class Schedule" /><GracefulPageLoading label="Loading class schedule" shape="directory" /></div>;
}
