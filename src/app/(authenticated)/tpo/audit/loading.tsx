import {PageHeader} from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function TpoAuditLoading(){
 return <section aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Oversight" title="Audit Log"
    description="Loading persisted college placement history…" />
  <p role="status" className="sr-only">Loading TPO audit events and summary…</p>
  <div aria-hidden="true" className="flex items-center gap-3 border-b border-border pb-4">
   <svg className="size-5 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
   </svg>
   <SkeletonBlock className="h-5 w-44" />
  </div>
  <div aria-hidden="true" className="space-y-2">
   <div className="grid grid-cols-5 gap-3 border-b border-border pb-3">
    {Array.from({length:5},(_,i)=><SkeletonBlock key={i} className="h-5" />)}
   </div>
   {Array.from({length:6},(_,r)=><div key={r} className="grid grid-cols-5 gap-3 border-b border-border py-3">
    {Array.from({length:5},(_,i)=><SkeletonBlock key={i} className="h-4" />)}
   </div>)}
  </div>
 </section>;
}
