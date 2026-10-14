export default function HrActivityLoading(){
 return <div aria-busy="true" aria-label="Loading recruiter hiring activity" className="space-y-4">
  <div className="h-20 animate-pulse rounded-xl bg-muted"/>
  <div className="h-12 animate-pulse rounded-xl bg-muted"/>
  <div className="grid gap-3 sm:grid-cols-2">
   {Array.from({length:4},(_,index)=><div key={index}
    className="h-24 animate-pulse rounded-xl bg-muted"/>)}
  </div>
 </div>;
}
