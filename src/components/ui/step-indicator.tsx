import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type StepIndicatorProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  current: number;
  total: number;
  title?: string;
  prefix?: string;
};

/** Compact legacy "Step n of m" label, used beside working Previous/Next links. */
export function StepIndicator({
  current, total, title, prefix = "Academic setup", className, ...props
}: StepIndicatorProps) {
  const safeTotal = Number.isFinite(total) ? Math.max(1, Math.trunc(total)) : 1;
  const safeCurrent = Number.isFinite(current) ? Math.min(safeTotal, Math.max(1, Math.trunc(current))) : 1;
  return <strong {...props} data-slot="step-indicator" aria-current="step"
    className={cx("text-[14px] font-semibold leading-5 text-[var(--lms-heading)]", className)}>
    {prefix} · Step {safeCurrent} of {safeTotal}{title ? `: ${title}` : ""}
  </strong>;
}
