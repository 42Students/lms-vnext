export default function Loading(){
 return <section role="status" aria-busy="true" aria-label="Loading verification" className="min-w-0 space-y-4 animate-pulse">
  <h1 className="text-xl font-semibold">Verification</h1>
  <p className="text-sm text-muted-foreground">Checking college verification access…</p>
  <div className="h-20 rounded border border-border bg-muted/40" aria-hidden="true"/>
  <div className="rounded border border-border p-4" aria-hidden="true">
   <div className="mb-4 h-5 w-40 rounded bg-muted"/>
   {Array.from({length:8},(_,i)=><div key={i} className="grid grid-cols-3 gap-4 border-t border-border py-3">
    <div className="h-4 rounded bg-muted"/><div className="h-4 rounded bg-muted"/><div className="h-4 rounded bg-muted"/>
   </div>)}
  </div>
 </section>;
}
