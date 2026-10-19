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
  const hoverRef = useRef(false);
  const pointerTypeRef = useRef("keyboard");
  const openAtPointerDown = useRef(false);
  return (
    <details ref={detailsRef} data-slot="info-popover" className={cx("group relative inline-block min-w-0 align-middle", className)}
      onPointerEnter={event => {
        if (event.pointerType !== "mouse") return;
        hoverRef.current = true;
        if (detailsRef.current) detailsRef.current.open = true;
      }}
      onPointerLeave={event => {
        if (event.pointerType !== "mouse") return;
        hoverRef.current = false;
        const trigger = detailsRef.current?.querySelector("summary");
        if (detailsRef.current && !trigger?.matches(":focus-visible")) detailsRef.current.open = false;
      }}
      onKeyDown={event => { if (event.key === "Escape" && detailsRef.current?.open) { detailsRef.current.open = false; event.preventDefault(); event.stopPropagation(); } }}
      onFocus={() => { if (detailsRef.current) detailsRef.current.open = true; }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget) && !hoverRef.current && detailsRef.current) detailsRef.current.open = false;
      }}>
      <summary aria-describedby={contentId} aria-label={label ?? (typeof children === "string" ? undefined : "More information")}
        onPointerDown={event => {
          pointerTypeRef.current = event.pointerType;
          openAtPointerDown.current = Boolean(detailsRef.current?.open);
        }}
        onClick={event => {
          // Hover/focus already exposed the tip. Native summary activation would
          // immediately close it; only a touch/pen tap intentionally toggles.
          event.preventDefault();
          if (!detailsRef.current) return;
          if (pointerTypeRef.current === "touch" || pointerTypeRef.current === "pen") {
            detailsRef.current.open = !openAtPointerDown.current;
          } else detailsRef.current.open = true;
          pointerTypeRef.current = "keyboard";
        }} className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden">
        {children}
      </summary>
      <div id={contentId} role="tooltip" className="relative z-30 mt-[var(--lms-space-2)] max-w-[calc(100vw_-_2rem)] whitespace-normal break-words rounded-[8px] border border-[var(--lms-tooltip-background)] bg-[var(--lms-tooltip-background)] min-h-[27px] px-[var(--lms-space-4)] py-1.5 text-[12px] leading-4 text-white shadow-[var(--lms-tooltip-shadow)] sm:absolute sm:left-0 sm:w-max sm:max-w-[260px]"><span aria-hidden="true" className="pointer-events-none absolute -top-[5px] left-4 h-[10px] w-[10px] rotate-45 bg-[var(--lms-tooltip-background)]" />{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
