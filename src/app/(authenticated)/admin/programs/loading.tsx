export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading programs" className="min-w-0 space-y-4 animate-pulse">
  <h1 className="text-xl font-semibold">Programs</h1>
  <p className="text-sm text-muted-foreground">Loading programs…</p>
  <div className="rounded border border-border p-4" aria-hidden="true">
   <div className="mb-3 h-5 w-40 rounded bg-muted"/>
   {Array.from({length:8},(_,i)=><div key={i} className="grid grid-cols-4 gap-4 border-t border-border py-3">
    <span className="h-4 rounded bg-muted"/><span className="h-4 rounded bg-muted"/>
    <span className="h-4 rounded bg-muted"/><span className="h-4 rounded bg-muted"/>
   </div>)}
  </div>
 </section>;
}
