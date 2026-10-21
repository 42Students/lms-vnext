import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** Legacy Drive day shows four loading rows before the assigned-round cards. */
export default function Loading(){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Drive day"
    description="Your assigned rounds for today, optimized for quick on-site access."/>
  <section aria-label="Loading drive-day assignments" role="status" className="space-y-3">
   <p className="text-sm text-body">Loading drive-day assignments</p>
   <div className="grid gap-3 md:grid-cols-2">
    {Array.from({length:4},(_,index)=><div key={index}
      className="min-h-[132px] rounded-[13px] border border-border bg-white p-4">
      <Skeleton variant="row" count={3} label={"Loading assigned round "+(index+1)}/>
    </div>)}
   </div>
  </section>
 </div>;
}
