import { PageHeader } from "@/components/ui/page-header";

export default function MentorMeetingsLoading() {
  return <div className="space-y-6" aria-busy="true" aria-label="Loading mentor meetings">
    <PageHeader eyebrow="Mentor" title="Meetings" description="Loading your project meetings…" />
    <div className="space-y-3">{[0, 1, 2].map(i =>
      <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-surface p-4">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="mt-3 h-4 w-64 max-w-full rounded bg-muted" />
        <div className="mt-4 h-4 w-40 rounded bg-muted" />
      </div>)}
    </div>
  </div>;
}
