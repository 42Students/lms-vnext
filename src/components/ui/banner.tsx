import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";
import type { AlertTone } from "./alert";

export type BannerProps = HTMLAttributes<HTMLElement> & {
  tone?: AlertTone;
  action?: ReactNode;
};
const tones = {
  info: "border-[#bde9ec] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] text-[#065f46]",
  warning: "border-[#f0d9ad] bg-[#fef6e7] text-[#92400e]",
  error: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] text-[#b91c1c]",
} as const;

/** Slim legacy LMS notice strip with an inline recovery action. */
export function Banner({ tone = "warning", action, className, children, role, ...props }: BannerProps) {
  return <aside {...props} data-slot="banner" role={role ?? (tone === "error" ? "alert" : "status")}
    className={cx("flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)] rounded-[var(--lms-control-radius)] border px-[var(--lms-space-4)] py-2.5 text-[var(--lms-font-sm)] leading-5 shadow-none", tones[tone], className)}>
    <div className="min-w-0 flex-1">{children}</div>
    {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
  </aside>;
}
