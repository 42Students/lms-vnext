import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

/** Keep an eight-row course table silhouette visible during initial course reads. */
export default function Loading(){
 return <section role="status" aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Courses" />
  <GracefulPageLoading shape="directory" label="Loading courses…" />
  <div aria-hidden="true" className="min-w-0 overflow-hidden rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface">
   <div className="grid grid-cols-7 gap-3 border-b border-[var(--lms-canvas-border)] p-3">
    {Array.from({length:7},(_,index)=><SkeletonBlock key={index} className="h-4" />)}
   </div>
   {Array.from({length:8},(_,index)=><div key={index} className="grid grid-cols-7 gap-3 border-b border-[var(--lms-canvas-border)] p-3 last:border-b-0">
    {Array.from({length:7},(_,i)=><SkeletonBlock key={i} className="h-4" />)}
   </div>)}
  </div>
 </section>;
}
