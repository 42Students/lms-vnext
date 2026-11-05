"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
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
  const suppressFocusOpen = useRef(false);
  useEffect(() => {
    const onOutsidePointerDown = (event: PointerEvent) => {
      const root = detailsRef.current;
      if (root?.open && event.target instanceof Node && !root.contains(event.target))
        root.open = false;
    };
    document.addEventListener("pointerdown", onOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", onOutsidePointerDown);
  }, []);
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
      onKeyDown={event => { if (event.key === "Escape" && detailsRef.current?.open) { detailsRef.current.open = false; const summary = detailsRef.current.querySelector<HTMLElement>("summary"); if (summary && document.activeElement !== summary) { suppressFocusOpen.current = true; summary.focus(); } event.preventDefault(); event.stopPropagation(); } }}
      onFocus={() => { if (suppressFocusOpen.current) { suppressFocusOpen.current = false; return; } if (detailsRef.current) detailsRef.current.open = true; }}
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
          } else if (event.detail === 0) {
            // Keyboard/assistive-technology activation toggles as native details does.
            detailsRef.current.open = !detailsRef.current.open;
          } else detailsRef.current.open = true;
          pointerTypeRef.current = "keyboard";
        }} className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] text-[var(--lms-primary-text)] focus-ring [&::-webkit-details-marker]:hidden">
        {children}
      </summary>
      <div id={contentId} role="tooltip" className="relative z-(--lms-z-sticky-header) mt-[var(--lms-space-2)] min-w-0 max-w-[calc(100vw_-_2rem)] whitespace-normal break-words rounded-[8px] border border-[var(--lms-tooltip-background)] bg-[var(--lms-tooltip-background)] px-[var(--lms-space-4)] py-[6px] min-h-[28px] text-[12px] leading-[16px] text-[color:var(--lms-on-primary)] shadow-(--lms-tooltip-shadow) max-md:fixed max-md:inset-x-3 max-md:bottom-[calc(var(--lms-mobile-footer-clearance,0px)+max(1rem,env(safe-area-inset-bottom)))] max-md:max-h-[40dvh] max-md:w-auto max-md:overflow-y-auto md:absolute md:left-0 md:w-max md:max-w-[260px]"><span aria-hidden="true" className="pointer-events-none absolute -top-[4px] right-3 h-[12px] w-[12px] rotate-45 bg-[var(--lms-tooltip-background)] max-md:hidden" />{content}</div>
    </details>
  );
}
export const Tooltip = InfoPopover;
