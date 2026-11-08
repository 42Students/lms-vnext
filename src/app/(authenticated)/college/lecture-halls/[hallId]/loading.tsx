import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";

export default function CollegeHallAvailabilityLoading() {
  return <div className="min-w-0 space-y-4"><PageHeader title="Lecture hall schedule" actions={<PageBackLink href="/college/lecture-halls" label="All lecture halls" />} /><GracefulPageLoading label="Loading hall availability" shape="directory" /></div>;
}
