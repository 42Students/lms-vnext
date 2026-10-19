"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type DropdownProps = Omit<HTMLAttributes<HTMLDetailsElement>, "children"> & {
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
  label?: string;
  align?: "start" | "end";
  /** Bottom sheet on phones, anchored dropdown on larger screens. */
  mobileSheet?: boolean;
};

/** Native disclosure handles Enter/Space without a JavaScript dependency. */
export function Dropdown({ trigger, triggerClassName, children, label, align = "start", mobileSheet = false, className, ...props }: DropdownProps) {
  const rootRef = useRef<HTMLDetailsElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const positionPanel = () => {
      if (!root.open) return;
      if (mobileSheet && window.innerWidth < 640) {
        panel.style.top = "auto";
        panel.style.bottom = "0";
        panel.style.transform = "none";
        panel.style.maxHeight = "70dvh";
        return;
      }
      panel.style.top = "calc(100% + 5px)";
      panel.style.bottom = "auto";
      panel.style.transform = "none";
      const anchor = root.getBoundingClientRect();
      const visual = window.visualViewport;
      const visibleTop = (visual?.offsetTop ?? 0) + 12;
      const visibleBottom = (visual?.offsetTop ?? 0) + (visual?.height ?? window.innerHeight) - 12;
      const visibleLeft = (visual?.offsetLeft ?? 0) + 12;
      const visibleRight = (visual?.offsetLeft ?? 0) + (visual?.width ?? window.innerWidth) - 12;
      const below = Math.max(1, visibleBottom - anchor.bottom);
      const above = Math.max(1, anchor.top - visibleTop);
      const needsFlip = below < Math.min(panel.scrollHeight, 200) && above > below;
      panel.style.maxHeight = `${Math.max(1, Math.floor(needsFlip ? above : below))}px`;
      if (needsFlip) {
        panel.style.top = "auto";
        panel.style.bottom = "calc(100% + 5px)";
      }
      const bounds = panel.getBoundingClientRect();
      const correction = Math.max(0, visibleLeft - bounds.left) - Math.max(0, bounds.right - visibleRight);
      if (correction) panel.style.transform = `translateX(${correction}px)`;
    };
    root.addEventListener("toggle", positionPanel);
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    window.visualViewport?.addEventListener("resize", positionPanel);
    window.visualViewport?.addEventListener("scroll", positionPanel);
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
      window.visualViewport?.removeEventListener("resize", positionPanel);
      window.visualViewport?.removeEventListener("scroll", positionPanel);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileSheet]);
  return <details ref={rootRef} data-slot="dropdown-root" data-mobile-sheet={mobileSheet || undefined} className={cx("group relative inline-block min-w-0 align-middle", className)} {...props}>
    <summary aria-label={label} onKeyDown={event => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      if (!rootRef.current) return;
      rootRef.current.open = true;
      const options = Array.from(rootRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"]):not(:disabled), [data-slot="dropdown"] a[href]:not([aria-disabled="true"])'));
      (event.key === "ArrowUp" ? options.at(-1) : options[0])?.focus();
    }} className="inline-flex min-h-9 cursor-pointer list-none items-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[14px] font-semibold leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden", mobileSheet ? "min-h-11" : "", triggerClassName)}>{trigger}</summary>
    <div ref={panelRef} data-slot="dropdown"
      className={cx("z-40 min-w-[100px] overflow-y-auto overscroll-contain border border-[var(--lms-canvas-border)] bg-white text-[14px] leading-5 text-[var(--lms-body-text)] shadow-[var(--lms-dropdown-shadow)]", mobileSheet ? "fixed inset-x-0 bottom-0 max-h-[70dvh] rounded-t-[12px] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-[calc(100%_+_5px)] sm:max-h-72 sm:w-72 sm:rounded-[6px] sm:p-3" : "absolute top-[calc(100%_+_5px)] max-h-[min(32rem,calc(100dvh_-_2rem))] max-w-[calc(100vw_-_1.5rem)] rounded-[6px] px-6 py-4", align === "end" ? "sm:right-0" : "sm:left-0")}
      onKeyDown={event => {
        if (event.target instanceof Element &&
          event.target.closest('input, select, textarea, dialog, [contenteditable="true"]')) return;
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"]):not(:disabled), a[href]:not([aria-disabled="true"]), button:not(:disabled)',
        )).filter(item => item.getClientRects().length > 0);
        if (!items.length) return;
        const index = items.indexOf(document.activeElement as HTMLElement);
        const target = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
          event.key === "ArrowUp" ? (index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length) :
          (index + 1) % items.length;
        event.preventDefault();
        items[target]?.focus();
      }}
      onClick={event => {
        const item = event.target instanceof Element ? event.target.closest('[role="menuitem"], a[href]') : null;
        if (!item || item.matches('[aria-disabled="true"], :disabled') || !rootRef.current) return;
        rootRef.current.open = false;
        rootRef.current.querySelector("summary")?.focus();
      }}>{children}</div>
  </details>;
}
