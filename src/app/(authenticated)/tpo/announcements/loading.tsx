import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading TPO announcements" className="space-y-3 p-4">
      <Skeleton variant="row" height={32} width={176} label="Loading TPO announcements" />
      <Skeleton variant="row" height={112} label="Loading TPO announcements" />
    </main>
  );
}
