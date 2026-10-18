import type { HTMLAttributes } from "react";
import { cx } from "@/lib/class-names";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "error";
};
const tones = {
  neutral: "bg-[#f1f4f9] text-[#54505d]",
  info: "bg-[#eff8fa] text-[#1a95a1]",
  success: "bg-[rgba(5,150,105,0.1)] text-[#059669]",
  warning: "bg-[rgba(217,119,6,0.1)] text-[#d97706]",
  error: "bg-[rgba(239,68,68,0.1)] text-[#ef4444]",
} as const;

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return <span data-slot="badge"
    className={cx("inline-flex min-h-[22px] max-w-full items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-[18px]", tones[tone], className)}
    {...props}>{children}</span>;
}
