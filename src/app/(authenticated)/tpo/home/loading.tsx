export default function Loading(){
 return <main className="space-y-5" role="status" aria-label="Loading placement home">
  <div className="h-4 w-48 animate-pulse rounded bg-muted"/>
  <div className="h-9 w-64 animate-pulse rounded bg-muted"/>
  <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
   <div className="h-48 animate-pulse rounded-xl border border-border bg-surface"/>
   <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
    {[0,1,2,3,4].map(i=><div key={i} className="h-14 animate-pulse rounded bg-muted"/>)}
   </div>
  </div>
  <span className="sr-only">Loading placement home</span>
 </main>;
}
