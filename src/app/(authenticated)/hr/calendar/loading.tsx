import { SkeletonBlock } from "@/components/ui/skeleton-block";
/** Legacy seven-row agenda skeleton. Navigation remains in the recruiter shell. */
export default function RecruiterCalendarLoading(){
 return <div className="min-w-0 max-w-full space-y-5" aria-label="Loading recruiter calendar" role="status">
  <SkeletonBlock className="h-9 w-40" />
  <div className="flex gap-2"><SkeletonBlock className="h-9 w-9" /><SkeletonBlock className="h-9 w-20" /><SkeletonBlock className="h-9 w-9" /></div>
  <SkeletonBlock className="h-5 w-56" />
  <div className="space-y-3">{Array.from({length:7},(_,index)=>
   <div key={index} className="flex min-w-0 items-center gap-3 rounded-[var(--lms-control-radius)] border border-border p-3">
    <SkeletonBlock className="size-10 shrink-0" />
    <div className="min-w-0 flex-1 space-y-2">
     <SkeletonBlock className="h-4 w-2/3" />
     <SkeletonBlock className="h-3 w-1/2" />
    </div>
   </div>)}</div>
  <span className="sr-only">Loading recruiter calendar</span>
 </div>;
}
