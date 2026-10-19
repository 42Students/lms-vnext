"use client";

import { forwardRef, type ComponentPropsWithoutRef, type KeyboardEvent } from "react";
import { cx } from "@/lib/class-names";

/**
 * Nonmodal disclosure panel. Unlike Dialog, it must not inert the rest of the
 * page. Callers own their open state and button; this owns consistent semantics
 * and the legacy popup surface (including keyboard-visible focus).
 */
export type PopoverPanelProps = Omit<ComponentPropsWithoutRef<"section">, "role" | "aria-modal" | "aria-label"> & {
  label: string;
};

export const PopoverPanel = forwardRef<HTMLElement, PopoverPanelProps>(
  function PopoverPanel({ label, className, children, ...rest }, ref) {
    return <section {...rest} ref={ref} role="dialog" aria-modal={false} aria-label={label}
      data-slot={rest["data-slot"] ?? "popover"}
      className={cx("min-w-0 rounded-[12px] border border-[var(--lms-canvas-border)] bg-white shadow-[var(--lms-overlay-shadow)]", className)}>
      {children}
    </section>;
  },
);

/** Anchored search/listbox panel shares LMS popup geometry without making the
 * search field inert. Native links inside remain real navigation targets. */
export type PopoverListboxProps = Omit<ComponentPropsWithoutRef<"div">, "role" | "aria-label"> & {
  label: string;
  onDismiss?: () => void;
};
export function PopoverListbox({ label, children, className, onDismiss, onKeyDown, ...props }: PopoverListboxProps) {
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss?.();
      event.currentTarget.parentElement?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href]:not([aria-disabled="true"])'));
    if (!links.length) return;
    const index = links.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 :
      event.key === "ArrowUp" ? (index < 0 ? links.length - 1 : (index - 1 + links.length) % links.length) :
      (index + 1) % links.length;
    event.preventDefault();
    links[next]?.focus();
  }
  return <div {...props} onKeyDown={handleKey} data-slot="popover-listbox" role="listbox" aria-label={label}
    className={cx("min-w-0 overflow-y-auto overscroll-contain rounded-[12px] border border-[var(--lms-canvas-border)] bg-white p-2 shadow-[var(--lms-overlay-shadow)]", className)}>
    {children}
  </div>;
}
