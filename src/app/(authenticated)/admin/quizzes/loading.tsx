/** Legacy Super Admin directory: eight visible rows at load, then the
 * authorized SSR result or a recoverable ErrorState on failure. */
export default function Loading(){
 return <div className="min-w-0 space-y-4" role="status" aria-label="Loading quizzes">
  <div className="h-8 w-36 animate-pulse rounded bg-muted"/>
  <div className="h-9 w-72 max-w-full animate-pulse rounded bg-muted"/>
  <div className="flex flex-wrap gap-3"><div className="h-9 w-48 animate-pulse rounded bg-muted"/><div className="h-9 w-40 animate-pulse rounded bg-muted"/></div>
  <div className="min-w-0 overflow-hidden rounded border border-border">
   <div className="h-10 animate-pulse bg-muted"/>
   {Array.from({length:8},(_,index)=><div key={index} className="flex min-h-12 gap-4 border-t border-border p-3">
    <div className="h-4 w-1/3 animate-pulse rounded bg-muted"/>
    <div className="h-4 w-1/4 animate-pulse rounded bg-muted"/>
    <div className="h-4 w-20 animate-pulse rounded bg-muted"/>
   </div>)}
  </div>
  <span className="sr-only">Loading quizzes…</span>
 </div>;
}
