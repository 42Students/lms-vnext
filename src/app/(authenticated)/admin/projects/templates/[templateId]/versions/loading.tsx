/** Legacy template history uses eight paragraph placeholders and a
 * distinct comparison loading section instead of an empty version table. */
export default function Loading(){
 const pulse="rounded-[var(--lms-control-radius)] bg-muted motion-safe:animate-pulse";
 return <div className="min-w-0 space-y-6" role="status" aria-busy="true" aria-live="polite">
  <p className="sr-only">Loading template version history and comparison</p>
  <h1 className="text-xl font-semibold">Template version history</h1>
  <section aria-label="Version history loading" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
   <div className={pulse+" mb-4 h-6 w-48"} aria-hidden="true"/>
   <div className="space-y-3" aria-hidden="true">
    {Array.from({length:8},(_,i)=><div key={i} className={pulse+" h-4 "+(i%3===2?"w-3/5":"w-full")}/>)}
   </div>
  </section>
  <section aria-label="Version comparison loading" className="rounded-[var(--lms-canvas-radius)] border border-border p-4">
   <div className={pulse+" h-6 w-48"} aria-hidden="true"/>
   <div className="mt-4 grid gap-4 sm:grid-cols-2" aria-hidden="true">
    <div className={pulse+" h-32"}/><div className={pulse+" h-32"}/>
   </div>
  </section>
 </div>;
}
