"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type DropdownProps = Omit<HTMLAttributes<HTMLDetailsElement>, "children"> & {
  trigger: ReactNode;
  children: ReactNode;
  label?: string;
  align?: "start" | "end";
};

/** Native disclosure handles Enter/Space without a JavaScript dependency. */
export function Dropdown({ trigger, children, label, align = "start", className, ...props }: DropdownProps) {
  const rootRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target) && rootRef.current) rootRef.current.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !rootRef.current?.open) return;
      rootRef.current.open = false;
      rootRef.current.querySelector("summary")?.focus();
      event.preventDefault();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, []);
  return <details ref={rootRef} data-slot="dropdown-root" className={cx("group relative inline-block min-w-0 align-middle", className)} {...props}>
    <summary aria-label={label} className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-semibold leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden">{trigger}</summary>
    <div data-slot="dropdown"
      className={cx("absolute top-[calc(100%+5px)] z-40 max-h-[min(32rem,calc(100dvh-2rem))] min-w-52 max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-[6px] border border-[var(--lms-canvas-border)] bg-white px-4 py-4 text-[14px] leading-5 text-[var(--lms-body-text)] shadow-[var(--lms-dropdown-shadow)] sm:px-6", align === "end" ? "right-0" : "left-0")}
      onClick={event => { if (event.target instanceof Element && event.target.closest('[role="menuitem"]:not([aria-disabled="true"]):not(:disabled)')) rootRef.current && (rootRef.current.open = false); }}>{children}</div>
  </details>;
}
