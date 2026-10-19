import { cx } from "@/lib/class-names";

/** Read-only proportional bar, using the legacy LMS teal and light-cyan tokens. */
export type MetricBarProps = {
  label: string;
  value: number;
  maximum: number;
  unit?: string;
  role?: "meter" | "progressbar" | "img";
  size?: "compact" | "default";
  className?: string;
};

export function MetricBar({
  label, value, maximum, unit = "", role = "meter", size = "compact", className,
}: MetricBarProps) {
  const safeMaximum = Number.isFinite(maximum) && maximum > 0 ? maximum : 0;
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const width = safeMaximum > 0 ? Math.min(100, (safeValue / safeMaximum) * 100) : 0;
  const numericText = new Intl.NumberFormat("en-IN").format(safeValue);
  return (
    <div
      data-slot="metric-bar"
      role={role}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMaximum}
      aria-valuenow={Math.min(safeMaximum, safeValue)}
      aria-valuetext={numericText + (unit ? " " + unit : "")}
      className={cx(
        "overflow-hidden rounded-full bg-[var(--lms-primary-light)]",
        size === "compact" ? "h-2" : "h-3",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--lms-primary)] transition-[width] duration-[var(--lms-motion-base)] motion-reduce:transition-none"
        style={{ width: width + "%" }}
      />
    </div>
  );
}
