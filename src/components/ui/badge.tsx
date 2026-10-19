import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "error";
};
const tones = {
  neutral: "bg-[var(--lms-neutral-100)] text-[var(--lms-neutral-700)]",
  info: "bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "bg-[var(--lms-success-subtle)] text-[var(--lms-success)]",
  warning: "bg-[var(--lms-warning-subtle)] text-[var(--lms-warning)]",
  error: "bg-[var(--lms-error-subtle)] text-[var(--lms-error)]",
} as const;

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return <span data-slot="badge"
    className={cx("inline-flex min-h-[22px] max-w-full items-center rounded-full px-2 py-0.5 text-[12px] font-semibold leading-[18px]", tones[tone], className)}
    {...props}>{children}</span>;
}
