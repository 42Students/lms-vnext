export default function Loading(){
 return <div role="status" aria-busy="true" aria-label="Loading contacts" className="min-w-0 space-y-4 animate-pulse">
  <h1 className="text-xl font-semibold">Contacts</h1>
  <p className="text-sm text-muted-foreground">Loading contacts…</p>
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">
   {Array.from({length:3},(_,i)=><div key={i} className="flex items-center gap-3 rounded border border-border p-4">
    <div className="size-10 shrink-0 rounded-full bg-muted"/>
    <div className="min-w-0 flex-1 space-y-2"><div className="h-4 w-3/4 rounded bg-muted"/>
     <div className="h-3 w-1/2 rounded bg-muted"/><div className="h-3 w-2/3 rounded bg-muted"/></div>
   </div>)}
  </div>
 </div>;
}
