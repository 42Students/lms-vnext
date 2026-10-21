import { cx } from "@/lib/class-names";

export type SkeletonProps = {
  variant?: "line" | "card" | "kpi" | "row" | "form";
  count?: number;
  /** Exact legacy placeholder dimensions in CSS px; defaults to the chosen variant. */
  height?: number;
  width?: number;
  label?: string;
  className?: string;
};

const shape = {
  line: "h-4 w-full",
  card: "h-40 w-full rounded-[var(--lms-radius-card)]",
  kpi: "h-28 w-full rounded-[var(--lms-radius-card)]",
  row: "h-12 w-full rounded-[var(--lms-control-radius)]",
  form: "h-16 w-full rounded-[var(--lms-radius-control)]",
} as const;

export function Skeleton({ variant = "line", count = 1, label = "Loading…", className, height, width }: SkeletonProps) {
  const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(20, Math.trunc(count))) : 1;
  return (
    <div role="status" aria-live="polite" data-slot="skeleton" className={cx("min-w-0 space-y-[var(--lms-space-3)]", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-[var(--lms-space-3)]">
        {Array.from({ length: safeCount }, (_, index) => (
          <div key={index} style={{ height, width, borderRadius: variant === "card" || variant === "kpi" ? "var(--lms-radius-card)" : undefined }} className={cx("lms-skeleton-shimmer rounded-[var(--lms-skeleton-radius)] bg-[var(--lms-neutral-100)] motion-reduce:animate-none", shape[variant])} />
        ))}
      </div>
    </div>
  );
}


/** Shared old-LMS learner overview loading shape. The same responsive
 * two/four-column grid remains mounted when real content replaces it.
 * Its decorative bars make one accessible loading announcement in total. */
export function LearnerOverviewSkeleton({label="Loading learner overview"}:{label?:string}={}){
  return (
    <section data-slot="learner-overview-skeleton" role="status" aria-live="polite"
      aria-busy="true" className="min-w-0 space-y-5 p-4 md:p-6">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-4">
        <div className="lms-skeleton-shimmer h-5 w-32 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
        <div className="lms-skeleton-shimmer h-8 w-[min(100%,420px)] rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
        <div className="lms-skeleton-shimmer h-4 w-[min(100%,600px)] rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({length:4},(_,i)=>(
            <div key={i} className="lms-skeleton-shimmer h-28 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
          ))}
        </div>
        <div className="space-y-3 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] p-3 md:p-4">
          <div className="lms-skeleton-shimmer h-5 w-32 rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
          {Array.from({length:5},(_,i)=>(
            <div key={i} className="lms-skeleton-shimmer h-11 w-full rounded bg-[var(--lms-neutral-100)] motion-reduce:animate-none"/>
          ))}
        </div>
      </div>
    </section>
  );
}
