import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type AlertTone = "info" | "success" | "warning" | "error";
export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  tone?: AlertTone;
  title?: ReactNode;
};
const tones = {
  info: "border-[#bde9ec] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  success: "border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] text-[var(--lms-success-text)]",
  warning: "border-[#f0d9ad] bg-[#fef6e7] text-[var(--lms-warning-text)]",
  error: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] text-[var(--lms-error-text)]",
} as const;

export function Alert({ tone = "info", title, className, children, role, ...props }: AlertProps) {
  return <div {...props} data-slot="alert" data-tone={tone} role={role ?? (tone === "error" ? "alert" : "status")}
    className={cx("flex min-w-0 max-w-full flex-col gap-[var(--lms-space-1)] rounded-[var(--lms-control-radius)] border px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-left text-[var(--lms-font-sm)] leading-5 break-words [overflow-wrap:anywhere] shadow-none", tones[tone], className)}>
    {title ? <strong className="min-w-0 break-words font-semibold">{title}</strong> : null}
    {children}
  </div>;
}
