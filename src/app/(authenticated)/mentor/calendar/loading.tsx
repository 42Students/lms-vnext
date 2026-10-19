import { PageHeader } from "@/components/ui/page-header";

export default function MentorMeetingsLoading() {
  return <div className="space-y-6" aria-busy="true" aria-label="Loading mentor meetings">
    <PageHeader eyebrow="Mentor" title="Meetings" description="Loading your project meetings…" />
    <div className="space-y-3">{[0, 1, 2].map(i =>
      <div key={i} className="animate-pulse border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="h-5 w-48 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
        <div className="mt-3 h-4 w-64 max-w-full rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
        <div className="mt-4 h-4 w-40 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-100)]" />
      </div>)}
    </div>
  </div>;
}
