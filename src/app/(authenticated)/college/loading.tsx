import { SkeletonBlock } from "@/components/ui/skeleton-block";
/** The old dashboard renders six independent compact attention-card placeholders. */
export default function CollegeDashboardLoading() {
  return <section className="space-y-4" role="status" aria-label="Loading college dashboard">
    <SkeletonBlock className="h-9 w-56" />
    <SkeletonBlock className="h-5 w-32" />
    <div className="grid grid-cols-1 gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-3 sm:grid-cols-3">
      {Array.from({length:3},(_,i)=><div key={i} className="space-y-2">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-7 w-20" />
      </div>)}
    </div>
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({length:6},(_,i)=><div key={i}
        className="min-h-[220px] space-y-4 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-4">
        <SkeletonBlock className="h-6 w-2/3" />
        {Array.from({length:3},(_,j)=><SkeletonBlock key={j} className="h-5 w-full" />)}
      </div>)}
    </div>
    <span className="sr-only">Loading the needs attention dashboard and college data</span>
  </section>;
}
