export default function Loading(){
 return <section aria-busy="true" aria-label="Loading batch students" className="space-y-4">
  <p role="status" className="text-sm text-body">Loading batch students…</p>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
   {[0,1,2,3].map(n=><div key={n} className="h-20 animate-pulse rounded-lg border border-border bg-surface-subtle"/>)}
  </div>
  <div className="space-y-3" aria-hidden="true">
   {[0,1,2].map(n=><div key={n} className="h-24 animate-pulse rounded-lg border border-border bg-surface-subtle"/>)}
  </div>
 </section>;
}
