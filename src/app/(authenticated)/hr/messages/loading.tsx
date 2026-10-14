export default function HrMessagesLoading(){
 return <div aria-busy="true" aria-label="Loading recruiter notifications" className="space-y-4">
  <div className="h-20 animate-pulse rounded-xl bg-muted"/>
  <div className="h-11 animate-pulse rounded-xl bg-muted"/>
  <div className="h-12 animate-pulse rounded-xl bg-muted"/>
  {Array.from({length:3},(_,index)=><div key={index}
   className="h-24 animate-pulse rounded-xl bg-muted"/>)}
 </div>;
}
