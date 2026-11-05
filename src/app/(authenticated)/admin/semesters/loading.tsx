import {PageHeader} from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function LoadingSuperAdminSemesters(){
 return <div className="space-y-6" aria-busy="true" role="status" aria-label="Loading semesters">
  <PageHeader title="Semesters"/>
  <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
   <SkeletonBlock className="h-72 border border-border" />
   <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
    <SkeletonBlock className="h-8 w-1/2" />
    {Array.from({length:8},(_,index)=><SkeletonBlock key={index} className="h-9" />)}
   </div>
  </div>
 </div>;
}
