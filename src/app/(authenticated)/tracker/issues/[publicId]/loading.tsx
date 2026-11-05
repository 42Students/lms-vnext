import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function TrackerIssueLoading(){
 return <div role="status" aria-label="Loading issue details" className="space-y-4">
  <SkeletonBlock className="h-7 w-32" />
  <SkeletonBlock className="h-9 w-2/3" />
  <SkeletonBlock className="h-20" />
  <SkeletonBlock className="h-36" />
  <span className="sr-only">Loading issue details…</span>
 </div>;
}
