/** Legacy candidate interview loading: four tiles and a 20-row agenda skeleton. */
export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading interviews" className="min-w-0 animate-pulse space-y-4">
  <h1 className="text-xl font-semibold">Interviews</h1>
  <p className="text-sm text-muted-foreground">Loading interviews...</p>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
   {Array.from({length:4},(_,i)=><div key={i} className="rounded border border-border p-4">
     <div className="h-3 w-16 rounded bg-muted"/><div className="mt-3 h-7 w-12 rounded bg-muted"/>
   </div>)}
  </div>
  <div className="space-y-2 border-y border-border py-4" aria-hidden="true">
   {Array.from({length:5},(_,i)=><div key={i} className="flex gap-3 py-2">
     <div className="h-9 w-9 rounded bg-muted"/><div className="h-9 flex-1 rounded bg-muted"/>
   </div>)}
  </div>
 </section>;
}
