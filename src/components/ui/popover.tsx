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
