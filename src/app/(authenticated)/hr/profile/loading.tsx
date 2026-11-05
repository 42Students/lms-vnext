import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function Loading(){
 return <div role="status" aria-busy="true" className="min-w-0 space-y-4" aria-label="Loading recruiter profile">
  <PageHeader title="Your Profile" />
  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]" aria-hidden="true">
   <div className="space-y-4 rounded border border-border p-4">
    <SkeletonBlock className="h-5 w-40" /><SkeletonBlock className="h-3 w-64 max-w-full" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
     {Array.from({length:4},(_,i)=><div key={i} className="space-y-2"><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="h-9 w-full" /></div>)}
    </div>
   </div>
   <aside className="space-y-3 rounded border border-border p-4">
    <SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="h-3 w-48 max-w-full" />
    <SkeletonBlock className="h-16" />
   </aside>
  </div>
 </div>;
}
