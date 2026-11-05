import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

export default function Loading(){
  return <div className="min-w-0 space-y-5" aria-busy="true" role="status" aria-label="Loading notifications">
    <PageHeader title="Notifications" />
    <div className="flex flex-wrap gap-2" aria-hidden="true">
      {Array.from({length:5},(_,i)=><SkeletonBlock key={i} className="h-9 w-24" />)}
    </div>
    <span className="sr-only">Loading notifications</span>
    <div className="space-y-3" aria-hidden="true">
      {Array.from({length:5},(_,i)=><SkeletonBlock key={i} className="h-28 border border-border" />)}
    </div>
  </div>;
}
