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
      <div className="relative z-30 mt-2 max-w-[min(20rem,calc(100vw-2rem))] rounded-[10px] border border-border bg-surface p-3 text-[13px] leading-5 text-body shadow-[var(--lms-overlay-shadow)] sm:absolute sm:left-0 sm:w-80">{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
