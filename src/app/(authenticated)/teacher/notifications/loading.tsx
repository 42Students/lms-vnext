import { PageHeader } from "@/components/ui/page-header";

export default function Loading(){
  return <div className="min-w-0 space-y-5" aria-busy="true" role="status" aria-label="Loading notifications">
    <PageHeader title="Notifications" />
    <div className="flex flex-wrap gap-2" aria-hidden="true">
      {Array.from({length:5},(_,i)=><div key={i}
        className="h-9 w-24 rounded-full bg-[var(--lms-neutral-100)] motion-safe:animate-pulse" />)}
    </div>
    <span className="sr-only">Loading notifications</span>
    <div className="space-y-3" aria-hidden="true">
      {Array.from({length:5},(_,i)=><div key={i}
        className="h-28 rounded-[12px] border border-border bg-[var(--lms-neutral-50)] motion-safe:animate-pulse" />)}
    </div>
  </div>;
}
