import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
/** Route fallback only; no private faculty fields are rendered before authentication. */
export default function FacultyDetailsLoading() {
 return <div role="status" aria-label="Loading faculty profile" aria-busy="true"
   className="min-w-0 max-w-full space-y-5">
   <PageHeader title="About & details" description="Loading your profile sections…"/>
   <div aria-hidden="true" className="space-y-3">
     {[1,2,3].map(item=><SkeletonBlock key={item} className="h-14 w-full" />)}
   </div>
 </div>;
}
