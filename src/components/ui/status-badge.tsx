import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type StatusBadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
  className?: string;
};

const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary-subtle text-primary-text",
  success: "bg-[var(--lms-success-subtle)] text-success",
  warning: "bg-[var(--lms-warning-subtle)] text-warning",
  error: "bg-[var(--lms-error-subtle)] text-error",
} as const;

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cx(
        "inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
