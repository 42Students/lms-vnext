import {PageHeader} from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function Loading(){
 return <section aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Calendar" />
  <p role="status" className="sr-only">Loading TPO calendar and scheduled events…</p>
  <div aria-hidden="true" className="space-y-3 border-t border-border pt-4">
   <div className="flex items-center gap-3">
    <SkeletonBlock className="h-9 w-28" />
    <SkeletonBlock className="h-9 w-36" />
    <SkeletonBlock className="h-9 w-24" />
   </div>
   <div className="grid grid-cols-7 gap-2">
    {Array.from({length:7},(_,i)=><SkeletonBlock key={i} className="h-7" />)}
   </div>
   {Array.from({length:6},(_,row)=><div key={row} className="grid grid-cols-7 gap-2">
     {Array.from({length:7},(_,cell)=><SkeletonBlock key={cell} className="h-14 border border-border" />)}
   </div>)}
  </div>
 </section>;
}
