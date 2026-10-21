import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";

/** Keep an eight-row course table silhouette visible during initial course reads. */
export default function Loading(){
 return <section role="status" aria-busy="true" className="min-w-0 space-y-4">
  <h1 className="text-2xl font-semibold text-[var(--lms-heading)]">Courses</h1>
  <GracefulPageLoading shape="directory" label="Loading courses…" />
  <div aria-hidden="true" className="min-w-0 overflow-hidden rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface">
   <div className="grid grid-cols-7 gap-3 border-b border-[var(--lms-canvas-border)] p-3">
    {Array.from({length:7},(_,index)=><div key={index} className="h-4 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
   </div>
   {Array.from({length:8},(_,index)=><div key={index} className="grid grid-cols-7 gap-3 border-b border-[var(--lms-canvas-border)] p-3 last:border-b-0">
    {Array.from({length:7},(_,i)=><div key={i} className="h-4 animate-pulse rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
   </div>)}
  </div>
 </section>;
}
