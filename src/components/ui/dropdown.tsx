import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type DropdownProps = Omit<HTMLAttributes<HTMLDetailsElement>, "children"> & {
  trigger: ReactNode;
  children: ReactNode;
  label?: string;
  align?: "start" | "end";
};

/** Native disclosure handles Enter/Space without a JavaScript dependency. */
export function Dropdown({ trigger, children, label, align = "start", className, ...props }: DropdownProps) {
  return <details data-slot="dropdown-root" className={cx("group relative inline-block min-w-0 align-middle", className)} {...props}>
    <summary aria-label={label} className="inline-flex min-h-9 cursor-pointer list-none items-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[14px] font-semibold leading-5 text-[var(--lms-body-text)] transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] [&::-webkit-details-marker]:hidden">{trigger}</summary>
    <div data-slot="dropdown"
      className={cx("absolute top-[calc(100%+5px)] z-40 min-w-52 max-w-[calc(100vw-1.5rem)] rounded-[14px] sm:rounded-[var(--lms-radius-control)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-space-4)] text-[14px] leading-5 text-[var(--lms-body-text)] shadow-[var(--lms-dropdown-shadow)] sm:px-[var(--lms-canvas-padding)] sm:py-[var(--lms-space-4)]", align === "end" ? "right-0" : "left-0")}>{children}</div>
  </details>;
}
