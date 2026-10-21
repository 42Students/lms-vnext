/** Mirrors legacy job overview and interview calendar loading without
 * making up a status while the college-scoped job is still resolving. */
export default function Loading(){
 const pulse="rounded-[var(--lms-control-radius)] bg-muted motion-safe:animate-pulse";
 return <div className="min-w-0 space-y-5" role="status" aria-live="polite" aria-busy="true">
  <span className="sr-only">Loading job overview, screening pipeline and interview calendar</span>
  <header className="flex min-w-0 flex-wrap items-center gap-4 border-b border-border pb-5">
   <div className={pulse+" h-14 w-14 shrink-0 rounded-full"} aria-hidden="true"/>
   <div className="min-w-0 flex-1 space-y-2" aria-hidden="true">
    <div className={pulse+" h-5 max-w-72"}/>
    <div className={pulse+" h-4 max-w-52"}/>
   </div>
   <div className="flex gap-2" aria-hidden="true">
    <div className={pulse+" h-10 w-24"}/><div className={pulse+" h-10 w-24"}/>
   </div>
  </header>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Pipeline statistics loading">
   {Array.from({length:6},(_,i)=><div key={i} className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4" aria-hidden="true">
    <div className={pulse+" h-4 w-20"}/><div className={pulse+" h-8 w-16"}/>
   </div>)}
  </div>
  <section className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border p-4" aria-label="Interview calendar loading">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <h2 className="text-base font-semibold">Interview calendar</h2>
    <div className={pulse+" h-9 w-24"} aria-hidden="true"/>
   </div>
   <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true"/>
    Loading interview schedule…
   </div>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7" aria-hidden="true">
    {Array.from({length:7},(_,i)=><div key={i} className={pulse+" h-24"})/> )}
   </div>
  </section>
 </div>;
}
