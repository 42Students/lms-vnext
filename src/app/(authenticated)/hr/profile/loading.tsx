export default function Loading(){
 return <div role="status" aria-busy="true" className="min-w-0 space-y-4 animate-pulse" aria-label="Loading recruiter profile">
  <h1 className="text-xl font-semibold">Your Profile</h1>
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]" aria-hidden="true">
   <div className="space-y-4 rounded border border-border p-4">
    <div className="h-5 w-40 rounded bg-muted"/><div className="h-3 w-64 max-w-full rounded bg-muted"/>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
     {Array.from({length:4},(_,i)=><div key={i} className="space-y-2"><div className="h-3 w-24 rounded bg-muted"/><div className="h-9 w-full rounded bg-muted"/></div>)}
    </div>
   </div>
   <aside className="space-y-3 rounded border border-border p-4">
    <div className="h-5 w-32 rounded bg-muted"/><div className="h-3 w-48 max-w-full rounded bg-muted"/>
    <div className="h-16 rounded bg-muted"/>
   </aside>
  </div>
 </div>;
}
