import { cx } from "@/lib/class-names";

export type StackedMetricSegment = {
  label: string;
  value: number;
  tone: "success" | "warning" | "primary" | "error" | "muted";
};

export type StackedMetricBarProps = {
  label: string;
  segments: readonly StackedMetricSegment[];
  maximum: number;
  className?: string;
};

/** Accessible legacy LMS three-tone proportions; no placeholders for missing data. */
export function StackedMetricBar({
  label, segments, maximum, className,
}: StackedMetricBarProps) {
  const safeMaximum = Number.isFinite(maximum) && maximum > 0 ? maximum : 0;
  const total = segments.reduce(
    (sum, segment) => sum + (Number.isFinite(segment.value) ? Math.max(0, segment.value) : 0),
    0,
  );
  const scale = safeMaximum > 0 && total > safeMaximum ? safeMaximum / total : 1;
  const width = (value: number) => safeMaximum > 0 && Number.isFinite(value)
    ? Math.max(0, value) * scale / safeMaximum * 100 + "%"
    : "0%";
  const color = {
    success: "bg-success",
    warning: "bg-warning",
    primary: "bg-[var(--lms-primary)]",
    error: "bg-error",
    muted: "bg-[var(--lms-neutral-500)]",
  } as const;
  return (
    <div
      data-slot="stacked-metric-bar"
      role="img"
      aria-label={label}
      className={cx(
        "flex h-3 overflow-hidden rounded-full bg-[var(--lms-primary-light)]",
        className,
      )}
    >
      {segments.map((segment, index) => (
        <span
          key={segment.label + index}
          title={segment.label + ": " + segment.value}
          className={color[segment.tone]}
          style={{ width: width(segment.value) }}
        />
      ))}
    </div>
  );
}
