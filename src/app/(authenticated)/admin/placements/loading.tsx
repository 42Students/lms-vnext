import {PageHeader} from "@/components/ui/page-header";
import {Skeleton} from "@/components/ui/skeleton";

export default function Loading(){
 return <section className="min-w-0 space-y-5" aria-busy="true">
  <PageHeader title="Drives"/>
  <p role="status" className="text-sm text-body">Refreshing placement drives…</p>
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Loading four placement summary cards">
   {Array.from({length:4},(_,i)=><div key={i} className="min-w-0 rounded-[var(--lms-radius-card)] border border-border bg-surface p-3">
    <Skeleton variant="kpi" label="Loading placement summary"/>
   </div>)}
  </div>
  <section className="space-y-3 border-t border-border pt-4" aria-label="Loading three attention items">
   <h2 className="text-base font-semibold">Needs doing</h2>
   <Skeleton variant="row" count={3} label="Loading placement attention items"/>
  </section>
 </section>;
}
