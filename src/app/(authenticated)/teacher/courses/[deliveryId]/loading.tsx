import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";

/** Legacy FacultyOverviewSkeleton: heading, command bar, overview and four
 * priority tiles. This route is the temporary bootstrap before teaching
 * assignment authorization in the course layout.
 */
export default function Loading() {
  return <section className="min-w-0 space-y-4" role="status" aria-busy="true" aria-label="Loading course">
    <PageBackLink href="/teacher/courses" label="Back to courses"/>
    <PageHeader title="Course" description="Course workspace"/>
    <div className="flex min-w-0 flex-wrap gap-2 border-b border-[var(--lms-canvas-border)] pb-3" aria-hidden="true">
      {Array.from({length:5},(_,index)=><span key={index}
        className="h-9 w-24 animate-pulse rounded-[var(--lms-control-radius)] bg-muted"/>)}
    </div>
    <div className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4" aria-hidden="true">
      <div className="h-6 w-48 animate-pulse rounded bg-muted"/>
      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted"/>
      <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-muted"/>
    </div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({length:4},(_,index)=><div key={index}
        className="min-h-[110px] space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted"/>
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted"/>
      </div>)}
    </div>
    <p className="sr-only">Loading course</p>
  </section>;
}
