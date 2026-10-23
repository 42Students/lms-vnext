import { PageHeader } from "@/components/ui/page-header";

/** The old LMS shows six course-card skeletons before authenticated enrolment resolves. */
export default function Loading() {
  return <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading courses">
    <PageHeader title="Courses" />
    <div className="grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]" aria-hidden="true">
      {Array.from({length:6},(_,index)=><div key={index}
        className="overflow-hidden rounded-xl border border-[var(--lms-canvas-border)] bg-surface">
        <div className="h-[140px] animate-pulse bg-muted"/>
        <div className="space-y-3 p-6">
          <div className="h-5 w-4/5 animate-pulse rounded bg-muted"/>
          <div className="h-4 w-2/5 animate-pulse rounded bg-muted"/>
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted"/>
        </div>
      </div>)}
    </div>
  </section>;
}
