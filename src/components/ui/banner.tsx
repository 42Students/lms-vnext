import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";
import type { AlertTone } from "./alert";

export type BannerProps = HTMLAttributes<HTMLElement> & {
  tone?: AlertTone;
  action?: ReactNode;
};
const tones = {
  info: "border-[var(--lms-info-border)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "border-[rgba(5,150,105,0.25)] bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
  warning: "border-[var(--lms-warning-border)] bg-[var(--lms-warning-surface)] text-[var(--lms-warning-text)]",
  error: "border-[rgba(239,68,68,0.25)] bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
} as const;

/** Slim legacy LMS notice strip with an inline recovery action. */
export function Banner({ tone = "warning", action, className, children, role, ...props }: BannerProps) {
  return <aside {...props} data-slot="banner" data-tone={tone} role={role ?? (tone === "error" ? "alert" : "status")}
    className={cx("flex min-w-0 max-w-full flex-wrap items-center justify-between gap-[var(--lms-space-3)] rounded-[var(--lms-control-radius)] border px-[var(--lms-space-4)] py-[10px] text-[var(--lms-font-sm)] font-normal tracking-normal leading-5 break-words [overflow-wrap:anywhere] shadow-none", tones[tone], className)}>
    <div className="flex min-w-0 flex-1 items-start gap-[var(--lms-space-2)]"><span aria-hidden="true" className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-current opacity-60" /><div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{children}</div></div>
    {action ? <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-[var(--lms-space-2)]">{action}</div> : null}
  </aside>;
}
