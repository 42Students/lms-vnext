import { SkeletonBlock } from "@/components/ui/skeleton-block";
/** Legacy Super Admin directory: eight visible rows at load, then the
 * authorized SSR result or a recoverable ErrorState on failure. */
export default function Loading(){
 return <div className="min-w-0 space-y-4" role="status" aria-label="Loading quizzes">
  <SkeletonBlock className="h-8 w-36" />
  <SkeletonBlock className="h-9 w-72 max-w-full" />
  <div className="flex flex-wrap gap-3"><SkeletonBlock className="h-9 w-48" /><SkeletonBlock className="h-9 w-40" /></div>
  <div className="min-w-0 overflow-hidden rounded border border-border">
   <SkeletonBlock className="h-10" />
   {Array.from({length:8},(_,index)=><div key={index} className="flex min-h-12 gap-4 border-t border-border p-3">
    <SkeletonBlock className="h-4 w-1/3" />
    <SkeletonBlock className="h-4 w-1/4" />
    <SkeletonBlock className="h-4 w-20" />
   </div>)}
  </div>
  <span className="sr-only">Loading quizzes…</span>
 </div>;
}
