export default function HrMessagesLoading(){
 return <div aria-busy="true" aria-label="Loading recruiter messages" className="space-y-4">
  <div className="h-9 w-48 animate-pulse rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
  <div className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
   {Array.from({length:4},(_,index)=><div key={index} className="flex items-center gap-4 py-4">
    <div className="h-5 min-w-0 flex-1 animate-pulse rounded-[6px] bg-[var(--lms-neutral-100)]"/>
    <div className="h-4 w-20 shrink-0 animate-pulse rounded-[6px] bg-[var(--lms-neutral-100)]"/>
   </div>)}
  </div>
 </div>;
}
