import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
  className?: string;
};
const toneClasses = {
  neutral: "bg-[#f1f4f9] text-[#54505d]",
  info: "bg-[#eff8fa] text-[#1a95a1]",
  success: "bg-[var(--lms-success-subtle)] text-success",
  warning: "bg-[var(--lms-warning-subtle)] text-warning",
  error: "bg-[var(--lms-error-subtle)] text-error",
} as const;

export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  return <span data-slot="status-badge" className={cx("inline-flex min-h-[22px] items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-[18px]", toneClasses[tone], className)}>{children}</span>;
}
