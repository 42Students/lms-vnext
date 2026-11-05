import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading placement schedule"
  className="min-w-0 space-y-4">
  <PageHeader title="Schedule" />
  <p className="text-sm text-muted-foreground">Loading your placement schedule…</p>
  <div aria-hidden="true" className="flex flex-wrap gap-2">
   {Array.from({length:3},(_,index)=><SkeletonBlock key={index} className="h-9 w-24" />)}
  </div>
  <div className="divide-y divide-border border-y border-border" aria-hidden="true">
   {Array.from({length:8},(_,index)=><div key={index} className="flex items-start gap-3 py-4">
    <SkeletonBlock className="h-20 w-16 shrink-0" />
    <div className="min-w-0 flex-1 space-y-2">
     <SkeletonBlock className="h-4 w-2/3" /><SkeletonBlock className="h-3 w-1/2" />
     <SkeletonBlock className="h-3 w-1/3" />
    </div>
   </div>)}
  </div>
 </section>;
}
