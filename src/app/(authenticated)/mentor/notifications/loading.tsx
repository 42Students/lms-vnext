import {PageHeader} from "@/components/ui/page-header";
export default function MentorNotificationsLoading(){
  return <div className="space-y-6" aria-busy="true" aria-label="Loading Mentor notifications">
    <PageHeader eyebrow="Mentor" title="Notifications"
      description="Loading your notifications and project attention…" />
    <div className="space-y-3">{[0,1,2].map(i=>
      <div key={i} className="animate-pulse border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="h-5 w-52 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
        <div className="mt-3 h-4 w-80 max-w-full rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]"/>
      </div>)}</div>
  </div>;
}
