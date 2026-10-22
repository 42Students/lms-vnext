/** Three old .ln-card-shaped loading rows, no synthetic appointments. */
export default function Loading(){
 return <div role="status" aria-busy="true" aria-label="Loading mentor calendar" className="space-y-4">
  <p className="text-sm text-muted-foreground">Loading mentor calendar…</p>
  {Array.from({length:3},(_,index)=><div key={index} aria-hidden="true"
    className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="w-2/3 space-y-3"><div className="h-4 w-3/4 animate-pulse rounded bg-muted"/>
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted"/></div>
      <div className="h-5 w-20 animate-pulse rounded bg-muted"/>
    </div>
    <div className="mt-4 h-3 w-2/5 animate-pulse rounded bg-muted"/>
    <div className="mt-3 h-4 w-24 animate-pulse rounded bg-muted"/>
  </div>)}
 </div>;
}
