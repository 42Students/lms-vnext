import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
};
const toneClasses = {
  neutral: "bg-[var(--lms-neutral-50)] text-[#84828b]",
  info: "bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
  warning: "bg-[var(--lms-warning-subtle)] text-[var(--lms-warning-text)]",
  error: "bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
} as const;

export function StatusBadge({ children, tone = "neutral", className, ...props }: StatusBadgeProps) {
  return <span {...props} data-slot="status-badge" data-tone={tone} data-variant="legacy-pill" className={cx("inline-flex min-h-[22px] min-w-[90px] max-w-full items-center justify-center gap-[var(--lms-space-1)] align-middle tabular-nums rounded-[6px] px-[15px] py-[2px] text-[12px] font-bold leading-[18px] text-center break-words shadow-none [overflow-wrap:anywhere]", toneClasses[tone], className)}>{children}</span>;
}
