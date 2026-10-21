import { PageHeader } from "@/components/ui/page-header";
/** Scoped module table transition: no stale prior-college rows while fresh
 * catalog/rules resolve. Legacy hub shows a spinner inside the list. */
export default function SuperAdminFeaturesLoading(){
 const pulse="rounded-[var(--lms-control-radius)] bg-muted motion-safe:animate-pulse";
 return <div className="min-w-0 space-y-5" role="status" aria-live="polite" aria-busy="true">
  <PageHeader eyebrow="Super Admin · Tenant Controls" title="Feature Controls"
    description="Reading persisted college module access rules."/>
  <div className="flex items-center gap-2 text-sm text-body">
   <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true"/>
   Loading feature controls for the selected scope…
  </div>
  <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4" aria-label="Feature matrix loading">
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
    {Array.from({length:4},(_,i)=><div key={i} className={pulse+" h-10"})/>}
   </div>
   <div className="min-w-0 overflow-x-auto" aria-hidden="true">
    <div className="min-w-[650px]">
     {Array.from({length:7},(_,r)=><div key={r} className="grid grid-cols-[minmax(180px,2fr)_repeat(3,minmax(90px,1fr))] gap-3 border-b border-border py-3">
      {Array.from({length:4},(_,c)=><span key={c} className={pulse+" h-5 "+(r===0?"opacity-70":"")}/>)}
     </div>)}
    </div>
   </div>
  </section>
 </div>;
}
