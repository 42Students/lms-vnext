export default function Loading(){
 return <div role="status" aria-busy="true" aria-label="Loading quiz report" className="min-w-0 space-y-4 animate-pulse">
  <h1 className="text-xl font-semibold">Loading quiz report</h1>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
    {Array.from({length:4},(_,i)=><div key={i} className="rounded border border-border p-4">
      <div className="h-3 w-20 rounded bg-muted"/>
      <div className="mt-3 h-6 w-14 rounded bg-muted"/>
    </div>)}
  </div>
  <div className="space-y-4 border-t border-border pt-4" aria-hidden="true">
    <div className="h-5 w-48 rounded bg-muted"/>
    {Array.from({length:5},(_,i)=><div key={i} className="h-8 w-full rounded bg-muted"/>)}
  </div>
 </div>;
}
