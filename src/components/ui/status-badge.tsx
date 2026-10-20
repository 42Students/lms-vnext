import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "error";
};
const toneClasses = {
  neutral: "bg-[var(--lms-neutral-50)] text-[#84828b]",
  info: "bg-[var(--lms-info-subtle)] text-[var(--lms-info)]",
  success: "bg-[var(--lms-success-subtle)] text-[var(--lms-success)]",
  warning: "bg-[var(--lms-warning-subtle)] text-[var(--lms-warning)]",
  error: "bg-[var(--lms-error-subtle)] text-[var(--lms-error)]",
} as const;

/** Legacy palette for a learner attendance cell (unmarked stays neutral, never an absence). */
export function attendanceStatusTone(status: string): NonNullable<StatusBadgeProps["tone"]> {
  switch (status.toUpperCase()) {
    case "PRESENT": return "success";
    case "ABSENT": return "error";
    case "LATE":
    case "MEDICAL":
    case "EXCUSED": return "warning";
    case "SCHEDULED": return "info";
    default: return "neutral";
  }
}

/** Shared legacy status colours for the same application across detail and history. */
export function applicationStatusTone(status: string): NonNullable<StatusBadgeProps["tone"]> {
  const value = status.toUpperCase().replace(/[\s-]+/g, "_");
  if (["SELECTED", "PLACED", "OFFERED", "ACCEPTED", "JOINED", "HIRED", "APPROVED", "SHORTLISTED"].includes(value)) return "success";
  if (["REJECTED", "CANCELLED", "NOT_SELECTED", "DISQUALIFIED", "INELIGIBLE"].includes(value)) return "error";
  if (["PENDING", "WAITLISTED", "UNDER_REVIEW", "WITHDRAWAL_REQUESTED", "DRAFT"].includes(value)) return "warning";
  if (["SUBMITTED", "APPLIED", "REGISTERED", "IN_PROGRESS", "IN_REVIEW", "INTERVIEWING", "SCHEDULED"].includes(value)) return "info";
  return "neutral";
}

export function StatusBadge({ children, tone = "neutral", className, ...props }: StatusBadgeProps) {
  const interactive = props.role === "button" || props.tabIndex !== undefined;
  const inactive = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return <span {...props} data-slot="status-badge" data-tone={tone} data-variant="legacy-pill" className={cx("inline-flex min-h-[22px] min-w-[90px] max-w-full items-center justify-center gap-[var(--lms-space-1)] align-middle tabular-nums rounded-[6px]! px-[15px]! py-[2px]! text-[12px] font-bold! leading-[18px] text-center break-words shadow-none [overflow-wrap:anywhere]", interactive && "cursor-pointer hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] max-[767px]:min-h-11", inactive && "cursor-not-allowed opacity-50 hover:brightness-100", toneClasses[tone], className)}>{children}</span>;
}
