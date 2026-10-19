import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "error";
};
const tones = {
  neutral: "bg-[var(--lms-neutral-100)] text-[var(--lms-neutral-700)]",
  info: "bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
  warning: "bg-[var(--lms-warning-subtle)] text-[var(--lms-warning-text)]",
  error: "bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
} as const;

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return <span data-slot="badge" data-tone={tone}
    className={cx("inline-flex min-h-[22px] min-w-0 max-w-full items-center justify-center gap-[var(--lms-space-1)] rounded-[var(--lms-radius-pill)] border border-current/10 px-[var(--lms-space-2)] py-0.5 text-center text-[var(--lms-font-xs)] font-semibold leading-[18px] [overflow-wrap:anywhere] shadow-none", tones[tone], className)}
    {...props}>{children}</span>;
}
