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
  const interactive = props.role === "button" || props.tabIndex !== undefined;
  const inactive = props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return <span {...props} data-slot="badge" data-tone={tone} data-variant="legacy-pill"
    className={cx("inline-flex min-h-[22px] min-w-0 max-w-full items-center justify-center gap-[var(--lms-space-1)] rounded-[var(--lms-radius-pill)] border border-current/10 px-[var(--lms-space-2)] py-[1px] align-middle whitespace-normal text-center tabular-nums text-[var(--lms-font-xs)] font-semibold leading-[18px] break-words shadow-none", interactive && "cursor-pointer hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] focus-visible:shadow-[0_0_0_4px_rgba(26,149,161,0.12)] max-[767px]:min-h-11", inactive && "cursor-not-allowed opacity-50 hover:brightness-100", tones[tone], className)}
    >{children}</span>;
}
