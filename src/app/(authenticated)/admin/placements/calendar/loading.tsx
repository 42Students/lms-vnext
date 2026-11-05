import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
/** Legacy candidate interview loading: four tiles and a 20-row agenda skeleton. */
export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading interviews" className="min-w-0 space-y-4">
  <PageHeader title="Interviews" />
  <p className="text-sm text-muted-foreground">Loading interviews...</p>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
   {Array.from({length:4},(_,i)=><div key={i} className="rounded border border-border p-4">
     <SkeletonBlock className="h-3 w-16" /><SkeletonBlock className="mt-3 h-7 w-12" />
   </div>)}
  </div>
  <div className="space-y-2 border-y border-border py-4" aria-hidden="true">
   {Array.from({length:5},(_,i)=><div key={i} className="flex gap-3 py-2">
     <SkeletonBlock className="h-9 w-9" /><SkeletonBlock className="h-9 flex-1" />
   </div>)}
  </div>
 </section>;
}
