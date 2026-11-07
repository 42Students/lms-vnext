import { Skeleton } from "@/components/ui/skeleton";

/** Placeholders follow the same three-section layout as the published page. */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-[color:var(--lms-neutral-50)] px-4 py-8" aria-busy="true">
      <main className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-5 sm:gap-6">
        <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6">
          <Skeleton variant="line" count={3} label="Loading college placements overview"/>
        </section>
        <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6">
          <Skeleton variant="line" count={2} label="Loading public placement outcomes"/>
          <div aria-hidden="true" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({length:4},(_,index)=>(
              <div key={index} className="rounded-[var(--lms-control-radius)] border border-border p-4">
                <Skeleton variant="line" count={2} label="Loading placement figure"/>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6">
          <Skeleton variant="line" count={3} label="Loading recruitment contact options"/>
        </section>
      </main>
    </div>
  );
}
