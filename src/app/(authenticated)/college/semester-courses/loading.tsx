import { PageHeader } from "@/components/ui/page-header";

/** Matches legacy SemesterCourseMapping TableSkeleton (six columns/rows). */
export default function SemesterCoursesLoading() {
  return <section className="min-w-0 space-y-5" role="status" aria-live="polite" aria-busy="true">
    <PageHeader title="Semester–Course Mapping" />
    <span className="sr-only">Loading semester courses</span>
    <div aria-hidden="true" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <div className="grid grid-cols-3 gap-3 border-b border-border pb-3 md:grid-cols-6">
        {Array.from({length:6},(_,column)=><span key={column}
          className={"lms-skeleton-shimmer h-4 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none "+(column>=3?"hidden md:block":"")}/>)}
      </div>
      {Array.from({length:6},(_,row)=><div key={row} className="grid min-h-12 grid-cols-3 items-center gap-3 border-b border-border py-2 last:border-b-0 md:grid-cols-6">
        {Array.from({length:6},(_,column)=><span key={column}
          className={"lms-skeleton-shimmer h-5 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none "+(column>=3?"hidden md:block":"")}/>)}
      </div>)}
    </div>
  </section>;
}
