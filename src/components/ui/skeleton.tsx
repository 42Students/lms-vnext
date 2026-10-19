import { cx } from "@/lib/class-names";

export type SkeletonProps = {
  variant?: "line" | "card" | "kpi" | "row" | "form";
  count?: number;
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

export function Skeleton({ variant = "line", count = 1, label = "Loading…", className }: SkeletonProps) {
  const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(20, Math.trunc(count))) : 1;
  return (
    <div role="status" aria-live="polite" data-slot="skeleton" className={cx("min-w-0 space-y-[var(--lms-space-3)]", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-[var(--lms-space-3)]">
        {Array.from({ length: safeCount }, (_, index) => (
          <div key={index} className={cx("lms-skeleton-shimmer rounded-[var(--lms-skeleton-radius)] bg-[var(--lms-neutral-100)] motion-reduce:animate-none", shape[variant])} />
        ))}
      </div>
    </div>
  );
}
