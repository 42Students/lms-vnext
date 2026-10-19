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
      <summary aria-label={label ?? (typeof children === "string" ? undefined : "More information")} className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden">
        {children}
      </summary>
      <div className="relative z-30 mt-2 max-w-[min(20rem,calc(100vw-2rem))] rounded-[8px] border border-[var(--lms-neutral-900)] bg-[var(--lms-neutral-900)] px-[var(--lms-space-4)] py-1.5 text-[12px] leading-4 text-white shadow-[var(--lms-tooltip-shadow)] sm:absolute sm:left-0 sm:max-w-[260px] sm:w-max">{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
