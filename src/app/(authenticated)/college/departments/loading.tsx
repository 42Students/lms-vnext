import { PageHeader } from "@/components/ui/page-header";

/** Reserve the legacy eight-row, six-column department directory while the
 * scoped college and dependency counts are being loaded. */
export default function DepartmentsLoading() {
  return <section className="min-w-0 space-y-4" role="status" aria-live="polite" aria-busy="true">
    <PageHeader title="Departments" />
    <span className="sr-only">Loading departments</span>
    <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12" aria-hidden="true">
      <div className="h-48 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 lg:col-span-5">
        <div className="lms-skeleton-shimmer h-5 w-40 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none" />
        <div className="lms-skeleton-shimmer mt-8 h-9 w-full rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none" />
      </div>
      <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 lg:col-span-7">
        <div className="lms-skeleton-shimmer mb-4 h-5 w-40 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none" />
        <div className="grid grid-cols-3 gap-2 border-b border-border py-2 md:grid-cols-6">
          {Array.from({length:6},(_,index)=><div key={index}
            className="lms-skeleton-shimmer h-4 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>)}
        </div>
        {Array.from({length:8},(_,row)=><div key={row} className="grid min-h-11 grid-cols-3 gap-2 border-b border-border py-2 last:border-b-0 md:grid-cols-6">
          {Array.from({length:6},(_,column)=><div key={column}
            className={"lms-skeleton-shimmer h-5 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none "+(column>2?"hidden md:block":"")}/>)}
        </div>)}
      </div>
    </div>
  </section>;
}
