export default function LoadingMentorProject(){
 return <section role="status" aria-busy="true" aria-label="Loading project workspace" className="min-w-0 space-y-4">
  <h1 className="text-xl font-semibold">Loading project workspace…</h1>
  <div className="flex min-w-0 gap-3 border-b border-border pb-3" aria-hidden="true">
   {["Overview","Tasks","Team","Sprints"].map(v=><span key={v} className="h-4 w-20 animate-pulse rounded bg-muted"/>)}
  </div>
  <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
   {Array.from({length:3},(_,i)=><div key={i} className="rounded border border-border p-4">
    <div className="h-4 w-3/5 animate-pulse rounded bg-muted"/>
    <div className="mt-3 h-6 w-1/2 animate-pulse rounded bg-muted"/>
   </div>)}
  </div>
 </section>;
}
