import { PageHeader } from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function TpoProfileLoading(){
 return <section aria-busy="true" className="min-w-0 space-y-4">
  <PageHeader title="Your Profile" />
  <p role="status" className="sr-only">Loading your TPO profile…</p>
  <div aria-hidden="true" className="flex items-center gap-4 border-b border-border pb-5">
   <SkeletonBlock className="size-16 shrink-0" />
   <div className="min-w-0 flex-1 space-y-2">
    <SkeletonBlock className="h-5 w-36" />
    <SkeletonBlock className="h-4 w-52 max-w-full" />
   </div>
  </div>
  <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
   {Array.from({length:6},(_,i)=><div key={i} className="space-y-2 border-b border-border py-3">
    <SkeletonBlock className="h-3 w-24" />
    <SkeletonBlock className="h-5 w-48 max-w-full" />
   </div>)}
  </div>
 </section>;
}
