export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading placement schedule"
  className="min-w-0 space-y-4 animate-pulse">
  <h1 className="text-xl font-semibold">Schedule</h1>
  <p className="text-sm text-muted-foreground">Loading your placement schedule…</p>
  <div aria-hidden="true" className="flex flex-wrap gap-2">
   {Array.from({length:3},(_,index)=><span key={index} className="h-9 w-24 rounded bg-muted"/>)}
  </div>
  <div className="divide-y divide-border border-y border-border" aria-hidden="true">
   {Array.from({length:8},(_,index)=><div key={index} className="flex items-start gap-3 py-4">
    <div className="h-20 w-16 shrink-0 rounded bg-muted"/>
    <div className="min-w-0 flex-1 space-y-2">
     <div className="h-4 w-2/3 rounded bg-muted"/><div className="h-3 w-1/2 rounded bg-muted"/>
     <div className="h-3 w-1/3 rounded bg-muted"/>
    </div>
   </div>)}
  </div>
 </section>;
}
