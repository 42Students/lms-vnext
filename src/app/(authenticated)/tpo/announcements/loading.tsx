import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading TPO announcements" className="min-w-0 space-y-3">
      <PageHeader title="Announcements" />
      <Skeleton variant="row" height={32} width={176} label="Loading TPO announcements" />
      <Skeleton variant="row" height={112} label="Loading TPO announcements" />
    </div>
  );
}
