export default function Loading(){
 return <main aria-busy="true" aria-label="Loading placement batches" className="min-w-0 space-y-4">
  <p role="status" className="text-sm text-body">Loading placement batches…</p>
  <div aria-hidden="true" className="h-16 animate-pulse rounded-lg border border-border bg-surface-subtle"/>
  <div aria-hidden="true" className="grid gap-3 md:grid-cols-2">
   {[0,1,2,3].map(n=><div key={n} className="h-32 animate-pulse rounded-lg border border-border bg-surface-subtle"/>)}
  </div>
 </main>;
}
