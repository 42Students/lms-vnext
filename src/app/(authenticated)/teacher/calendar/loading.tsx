/** Calendar skeleton matches seven weekdays and 21 legacy cells. */
export default function Loading(){
 const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
 return <section role="status" aria-label="Loading faculty calendar" aria-busy="true"
  className="min-w-0 space-y-4 animate-pulse">
  <h1 className="h-7 w-48 rounded bg-muted"><span className="sr-only">Loading faculty calendar…</span></h1>
  <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-border">
   {days.map(day=><div key={day} className="min-w-0 bg-surface p-2 text-center text-xs font-semibold text-muted-foreground">
    <span className="hidden sm:inline">{day}</span><span className="sm:hidden">{day.slice(0,3)}</span>
   </div>)}
   {Array.from({length:21},(_,index)=><div key={index} aria-hidden="true"
    className="min-h-24 min-w-0 bg-surface p-2 sm:min-h-32">
    <div className="h-3 w-8 max-w-full rounded bg-muted"/>
    {index%3!==2?<div className="mt-4 h-9 rounded bg-muted/70"/>:null}
   </div>)}
  </div>
 </section>;
}
