import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { PageHeader } from "@/components/ui/page-header";
export default function TrackerIssueLoading(){
 return <div role="status" aria-label="Loading issue details" aria-busy="true" className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Issue details" description="Loading the issue and its current status…" />
  <SkeletonBlock className="h-7 w-32" />
  <SkeletonBlock className="h-9 w-2/3" />
  <SkeletonBlock className="h-20" />
  <SkeletonBlock className="h-36" />
  <span className="sr-only">Loading issue details…</span>
 </div>;
}
