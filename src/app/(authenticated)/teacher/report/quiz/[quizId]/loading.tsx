import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function Loading(){
 return <div role="status" aria-busy="true" aria-label="Loading quiz report" className="min-w-0 space-y-4">
  <PageHeader title="Loading quiz report" />
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
    {Array.from({length:4},(_,i)=><div key={i} className="rounded border border-border p-4">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="mt-3 h-6 w-14" />
    </div>)}
  </div>
  <div className="space-y-4 border-t border-border pt-4" aria-hidden="true">
    <SkeletonBlock className="h-5 w-48" />
    {Array.from({length:5},(_,i)=><SkeletonBlock key={i} className="h-8 w-full" />)}
  </div>
 </div>;
}
