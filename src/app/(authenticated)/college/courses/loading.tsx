import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
 return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading courses">
  <PageHeader title="Courses"/>
  <section className="min-w-0 overflow-x-auto border border-border bg-surface" role="status">
   <span className="sr-only">Loading the course catalogue…</span>
   <div className="min-w-[700px] space-y-3 p-4" aria-hidden="true">
    <div className="grid grid-cols-7 gap-3 border-b border-border pb-3">
     {Array.from({length:7},(_,i)=><div key={i} className="h-4 animate-pulse rounded bg-muted"/>)}
    </div>
    {Array.from({length:8},(_,row)=><div key={row}
     className="grid grid-cols-7 gap-3 border-b border-border py-2">
     {Array.from({length:7},(_,col)=><div key={col} className="h-5 animate-pulse rounded bg-muted"/>)}
    </div>)}
   </div>
  </section>
 </div>;
}
