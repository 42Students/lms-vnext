"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
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
};
export function PopoverListbox({ label, children, className, ...props }: PopoverListboxProps) {
  return <div {...props} data-slot="popover-listbox" role="listbox" aria-label={label}
    className={cx("min-w-0 overflow-y-auto overscroll-contain rounded-[12px] border border-[var(--lms-canvas-border)] bg-white p-2 shadow-[var(--lms-overlay-shadow)]", className)}>
    {children}
  </div>;
}
