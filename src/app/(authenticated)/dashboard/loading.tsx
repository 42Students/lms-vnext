import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** Match the real dashboard header and responsive metric grid during loading. */
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-5" role="status" aria-label="Loading dashboard" aria-busy="true">
    <PageHeader title="Dashboard" description="Loading your authorized workspace overview..." />
    <div aria-hidden="true" className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({length:4},(_,index)=><div key={index} className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-8 w-1/3" />
        <SkeletonBlock className="h-4 w-full" />
      </div>)}
    </div>
    <GracefulPageLoading label="Loading dashboard…" shape="directory" />
  </div>;
}
