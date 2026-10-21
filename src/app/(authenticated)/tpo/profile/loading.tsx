export default function TpoProfileLoading(){
 return <section aria-busy="true" className="min-w-0 space-y-4">
  <h1 className="text-xl font-semibold">Your Profile</h1>
  <p role="status" className="sr-only">Loading your TPO profile…</p>
  <div aria-hidden="true" className="flex items-center gap-4 border-b border-border pb-5">
   <div className="size-16 shrink-0 animate-pulse rounded-full bg-muted"/>
   <div className="min-w-0 flex-1 space-y-2">
    <div className="h-5 w-36 animate-pulse rounded bg-muted"/>
    <div className="h-4 w-52 max-w-full animate-pulse rounded bg-muted"/>
   </div>
  </div>
  <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
   {Array.from({length:6},(_,i)=><div key={i} className="space-y-2 border-b border-border py-3">
    <div className="h-3 w-24 animate-pulse rounded bg-muted"/>
    <div className="h-5 w-48 max-w-full animate-pulse rounded bg-muted/70"/>
   </div>)}
  </div>
 </section>;
}
