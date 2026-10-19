import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
  className?: string;
};
const toneClasses = {
  neutral: "bg-[var(--lms-neutral-100)] text-[var(--lms-neutral-700)]",
  info: "bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
  warning: "bg-[var(--lms-warning-subtle)] text-[var(--lms-warning-text)]",
  error: "bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
} as const;

export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return <span data-slot="status-badge" className={cx("inline-flex min-h-[22px] items-center rounded-[var(--lms-radius-pill)] px-[var(--lms-space-2)] py-0.5 text-[12px] font-semibold leading-[18px]", toneClasses[tone], className)}>{children}</span>;
}
