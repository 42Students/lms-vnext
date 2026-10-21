import {PageHeader} from "@/components/ui/page-header";
export default function TrackerIssuesLoading(){
 return <div className="min-w-0 space-y-5" aria-busy="true" role="status" aria-label="Loading reported issues">
  <PageHeader eyebrow="42 Tracker" title="Issues" description="Loading reported issues…" />
  <div className="grid gap-3 md:grid-cols-3">
   {[0,1,2].map(i=><div key={i} className="h-10 rounded-md bg-[var(--lms-neutral-50)] motion-safe:animate-pulse"/>)}
  </div>
  <span className="sr-only">Loading issues</span>
  {[0,1,2].map(index=><div key={index}
    className="h-40 rounded-[10px] border border-border bg-[var(--lms-neutral-50)] motion-safe:animate-pulse"
    aria-hidden="true"/>)}
 </div>;
}
