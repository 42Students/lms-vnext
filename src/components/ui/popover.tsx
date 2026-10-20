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
  /** Used by nonmodal menus; callers still own their open state. */
  onDismiss?: () => void;
};

export const PopoverPanel = forwardRef<HTMLElement, PopoverPanelProps>(
  function PopoverPanel({ label, className, children, onDismiss, onKeyDown, ...rest }, ref) {
    return <section {...rest} ref={ref} role="dialog" aria-modal={false} aria-label={label}
      onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented && event.key === "Escape" && onDismiss) { event.preventDefault(); event.stopPropagation(); onDismiss(); } }}
      data-slot={rest["data-slot"] ?? "popover"}
      className={cx("min-w-[100px] min-h-[150px] rounded-[6px] border border-[var(--lms-canvas-border)] bg-white px-6 py-4 shadow-[var(--lms-dropdown-shadow)] max-[767px]:rounded-[14px] max-[767px]:p-4", className)}>
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
      // Keep Escape inside this nonmodal listbox from closing an outer menu/dialog.
      event.stopPropagation();
      onDismiss?.();
      const trigger = event.currentTarget.parentElement?.querySelector<HTMLElement>("input, button[aria-expanded], [role=combobox]");
      trigger?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    // Preserve text-input caret controls when the popup embeds an editable field.
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const options = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href]:not([aria-disabled="true"]), button[role="option"]:not(:disabled), [role="option"] button:not(:disabled), [role="option"][tabindex]:not([tabindex="-1"])',
    )).filter(item => item.getClientRects().length > 0 && !item.closest("[hidden], [inert], [aria-disabled=\"true\"]"));
    if (!options.length) return;
    const index = options.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 :
      event.key === "ArrowUp" ? (index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length) :
      (index + 1) % options.length;
    event.preventDefault();
    options[next]?.focus();
  }
  return <div {...props} onKeyDown={handleKey} data-slot="popover-listbox" role="listbox" aria-label={label}
    className={cx("min-w-0 min-h-[120px] max-h-[200px] overflow-y-auto overscroll-contain rounded-[12px] border border-[var(--lms-canvas-border)] bg-white px-0 py-[5px] shadow-[0_14px_16px_rgba(0,0,0,0.04)] [&_[role=option]]:min-h-11 [&_[role=option]]:px-[10px] [&_[role=option]]:py-[5px] [&_[role=option]:hover]:bg-[#d1f1f1] [&_a:hover]:bg-[#d1f1f1] [&_button:hover]:bg-[#d1f1f1]", className)}>
    {children}
  </div>;
}
