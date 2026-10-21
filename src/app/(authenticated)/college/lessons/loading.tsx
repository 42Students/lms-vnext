import { PageHeader } from "@/components/ui/page-header";

/** Old LMS initial lesson directory: choose a course first and reserve eight
 * stable rows while the filter choices and first result set load. */
export default function Loading() {
  return <section className="min-w-0 space-y-5" role="status" aria-live="polite" aria-busy="true">
    <PageHeader title="Lessons" />
    <p className="text-sm text-muted-foreground">Choose a course to see its lessons.</p>
    <span className="sr-only">Loading lessons…</span>
    <div aria-hidden="true" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <div className="grid grid-cols-4 gap-3 border-b border-border pb-3 md:grid-cols-6">
        {Array.from({length:6},(_,index)=><span key={index}
          className={"lms-skeleton-shimmer h-4 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none "+(index>3?"hidden md:block":"")}/>)}
      </div>
      {Array.from({length:8},(_,row)=><div key={row} className="grid min-h-11 grid-cols-4 items-center gap-3 border-b border-border py-2 last:border-b-0 md:grid-cols-6">
        {Array.from({length:6},(_,column)=><span key={column}
          className={"lms-skeleton-shimmer h-5 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none "+(column>3?"hidden md:block":"")}/>)}
      </div>)}
    </div>
  </section>;
}
