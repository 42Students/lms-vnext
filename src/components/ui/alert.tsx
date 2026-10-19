import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type AlertTone = "info" | "success" | "warning" | "error";
export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  tone?: AlertTone;
  title?: ReactNode;
};
const tones = {
  info: "border-[#bde9ec] bg-[#eff8fa] text-[#1a95a1]",
  success: "border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.08)] text-[#065f46]",
  warning: "border-[#f0d9ad] bg-[#fef6e7] text-[#92400e]",
  error: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] text-[#b91c1c]",
} as const;

export function Alert({ tone = "info", title, className, children, role, ...props }: AlertProps) {
  return <div {...props} data-slot="alert" role={role ?? (tone === "error" ? "alert" : "status")}
    className={cx("flex min-w-0 flex-col gap-1 rounded-[var(--lms-control-radius)] border px-4 py-3 text-[13px] leading-5", tones[tone], className)}>
    {title ? <strong className="font-semibold">{title}</strong> : null}
    {children}
  </div>;
}
