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
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const positionPanel = () => {
      if (!root.open) return;
      panel.style.top = "calc(100% + 5px)";
      panel.style.bottom = "auto";
      panel.style.transform = "none";
      const anchor = root.getBoundingClientRect();
      const below = Math.max(1, window.innerHeight - anchor.bottom - 12);
      const above = Math.max(1, anchor.top - 12);
      const needsFlip = below < Math.min(panel.scrollHeight, 200) && above > below;
      panel.style.maxHeight = `${Math.floor(needsFlip ? above : below)}px`;
      if (needsFlip) {
        panel.style.top = "auto";
        panel.style.bottom = "calc(100% + 5px)";
      }
      const bounds = panel.getBoundingClientRect();
      const correction = Math.max(0, 12 - bounds.left) - Math.max(0, bounds.right - window.innerWidth + 12);
      if (correction) panel.style.transform = `translateX(${correction}px)`;
    };
    root.addEventListener("toggle", positionPanel);
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target) && rootRef.current) rootRef.current.open = false;
    };
    const onFocusIn = (event: FocusEvent) => {
      if (rootRef.current?.open && event.target instanceof Node && !rootRef.current.contains(event.target)) rootRef.current.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !rootRef.current?.open) return;
      rootRef.current.open = false;
      rootRef.current.querySelector("summary")?.focus();
      event.preventDefault();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("toggle", positionPanel);
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  return <details ref={rootRef} data-slot="dropdown-root" className={cx("group relative inline-block min-w-0 align-middle", className)} {...props}>
    <summary aria-label={label} onKeyDown={event => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      if (!rootRef.current) return;
      rootRef.current.open = true;
      const options = Array.from(rootRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"]):not(:disabled), [data-slot="dropdown"] a[href]'));
      (event.key === "ArrowUp" ? options.at(-1) : options[0])?.focus();
    }} className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-3 text-[14px] font-semibold leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden">{trigger}</summary>
    <div ref={panelRef} data-slot="dropdown"
      className={cx("absolute top-[calc(100%+5px)] z-40 max-h-[min(32rem,calc(100dvh-2rem))] min-w-52 max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-[6px] border border-[var(--lms-canvas-border)] bg-white px-4 py-4 text-[14px] leading-5 text-[var(--lms-body-text)] shadow-[var(--lms-dropdown-shadow)] sm:px-6", align === "end" ? "right-0" : "left-0")}
      onClick={event => {
        const item = event.target instanceof Element ? event.target.closest('[role="menuitem"], a[href]') : null;
        if (!item || item.matches('[aria-disabled="true"], :disabled') || !rootRef.current) return;
        rootRef.current.open = false;
        rootRef.current.querySelector("summary")?.focus();
      }}>{children}</div>
  </details>;
}
