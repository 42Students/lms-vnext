import {PageHeader} from "@/components/ui/page-header";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
export default function TrackerIssuesLoading(){
 return <div className="min-w-0 space-y-5" aria-busy="true" role="status" aria-label="Loading reported issues">
  <PageHeader eyebrow="42 Tracker" title="Issues" description="Loading reported issues…" />
  <div className="grid gap-3 md:grid-cols-3">
   {[0,1,2].map(i=><SkeletonBlock key={i} className="h-10" />)}
  </div>
  <span className="sr-only">Loading issues</span>
  {[0,1,2].map(index=><SkeletonBlock key={index} className="h-40 border border-border" />)}
 </div>;
}
