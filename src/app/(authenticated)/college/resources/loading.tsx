import { PageHeader } from "@/components/ui/page-header";
export default function CollegeResourcesLoading(){
 return <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading resources">
  <PageHeader title="Resources"
   description="Give a lesson reading material: files, links and notes, together in one resource."/>
  <p role="status" className="text-sm text-body">Refreshing resources…</p>
  <div className="overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)]" aria-hidden="true">
   <div className="grid grid-cols-5 gap-3 border-b border-border bg-muted/30 p-3">
    {Array.from({length:5},(_,index)=><span key={index} className="h-4 animate-pulse rounded bg-muted"/>)}
   </div>
   {Array.from({length:6},(_,row)=><div key={row} className="grid grid-cols-5 gap-3 border-b border-border p-3 last:border-b-0">
    {Array.from({length:5},(_,column)=><span key={column} className="h-4 animate-pulse rounded bg-muted"/>)}
   </div>)}
  </div>
 </section>;
}
