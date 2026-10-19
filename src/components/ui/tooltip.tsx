"use client";

import { useId, useRef, type ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  /** Required for icon-only children to convey the disclosure purpose. */
  label?: string;
};
export function InfoPopover({ content, children, className, label }: TooltipProps) {
  const contentId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={detailsRef} data-slot="info-popover" className={cx("group relative inline-block min-w-0 align-middle", className)}
      onMouseEnter={() => { if (detailsRef.current) detailsRef.current.open = true; }}
      onMouseLeave={() => { if (detailsRef.current) detailsRef.current.open = false; }}
      onFocus={() => { if (detailsRef.current) detailsRef.current.open = true; }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && detailsRef.current) detailsRef.current.open = false; }}>
      <summary aria-describedby={contentId} aria-label={label ?? (typeof children === "string" ? undefined : "More information")} className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden">
        {children}
      </summary>
      <div id={contentId} role="tooltip" className="relative z-30 mt-2 max-w-[calc(100vw-2rem)] overflow-x-auto rounded-[8px] border border-[#1a1d21] bg-[#1a1d21] px-4 py-1.5 text-[12px] leading-4 text-white shadow-[var(--lms-tooltip-shadow)] sm:absolute sm:left-0 sm:w-max sm:max-w-[260px]">{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
