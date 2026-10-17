import { cx } from "@/lib/class-names";

export type SkeletonProps = {
  variant?: "line" | "card" | "kpi" | "row" | "form";
  count?: number;
  label?: string;
  className?: string;
};

const shape = {
  line: "h-4 w-full",
  card: "h-40 w-full",
  kpi: "h-28 w-full",
  row: "h-24 w-full",
  form: "h-16 w-full",
} as const;

export function Skeleton({ variant = "line", count = 1, label = "Loading…", className }: SkeletonProps) {
  const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(20, Math.trunc(count))) : 1;
  return (
    <div role="status" aria-live="polite" aria-label={label} data-slot="skeleton" className={cx("min-w-0 space-y-3", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: safeCount }, (_, index) => (
          <div key={index} className={cx("animate-pulse rounded-lg bg-muted motion-reduce:animate-none", shape[variant])} />
        ))}
      </div>
    </div>
  );
}
