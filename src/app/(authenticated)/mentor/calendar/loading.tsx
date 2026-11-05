import { SkeletonBlock } from "@/components/ui/skeleton-block";
/** Three old .ln-card-shaped loading rows, no synthetic appointments. */
export default function Loading(){
 return <div role="status" aria-busy="true" aria-label="Loading mentor calendar" className="space-y-4">
  <p className="text-sm text-muted-foreground">Loading mentor calendar…</p>
  {Array.from({length:3},(_,index)=><div key={index} aria-hidden="true"
    className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="w-2/3 space-y-3"><SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" /></div>
      <SkeletonBlock className="h-5 w-20" />
    </div>
    <SkeletonBlock className="mt-4 h-3 w-2/5" />
    <SkeletonBlock className="mt-3 h-4 w-24" />
  </div>)}
 </div>;
}
