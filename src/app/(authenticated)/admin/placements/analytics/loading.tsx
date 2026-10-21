import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** A small inline refresh notice; avoid the full-page directory placeholder over last-good analytics. */
export default function Loading() {
 return <section className="min-w-0 space-y-[var(--lms-space-4)]" aria-busy="true">
  <PageHeader title="Placement Analytics" />
  <p role="status" aria-live="polite" className="text-sm text-[var(--lms-body-text)]">Refreshing hiring dashboard…</p>
  <div className="border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]" aria-hidden="true">
   <Skeleton variant="kpi" count={6} label="Refreshing six hiring dashboard metrics" />
  </div>
 </section>;
}
