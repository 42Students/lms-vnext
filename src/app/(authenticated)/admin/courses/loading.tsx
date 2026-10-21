export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading courses" className="min-w-0 animate-pulse space-y-4">
  <h1 className="text-xl font-semibold">Courses</h1>
  <p className="text-sm text-muted-foreground">Loading courses…</p>
  <div aria-hidden="true" className="rounded border border-border p-4">
   {Array.from({length:8},(_,i)=><div key={i} className="flex gap-4 border-b border-border py-3">
    <span className="h-4 w-2/5 rounded bg-muted"/><span className="h-4 w-1/5 rounded bg-muted"/>
    <span className="h-4 w-1/5 rounded bg-muted"/>
   </div>)}
  </div>
 </section>;
}
