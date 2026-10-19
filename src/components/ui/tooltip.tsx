import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  /** Required for icon-only children to convey the disclosure purpose. */
  label?: string;
};
export function InfoPopover({ content, children, className, label }: TooltipProps) {
  return (
    <details data-slot="info-popover" className={cx("group relative inline-block min-w-0 align-middle", className)}>
      <summary aria-label={label ?? (typeof children === "string" ? undefined : "More information")} className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[9px] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] [&::-webkit-details-marker]:hidden">
        {children}
      </summary>
      <div className="relative z-30 mt-2 max-w-[min(20rem,calc(100vw-2rem))] rounded-[8px] border border-[#1a1d21] bg-[#1a1d21] px-4 py-1.5 text-[12px] leading-4 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] sm:absolute sm:left-0 sm:max-w-[260px] sm:w-max">{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
