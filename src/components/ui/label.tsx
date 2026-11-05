import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type LabelProps = ComponentPropsWithRef<"label"> & {
  /** "field" labels a form control above it; "choice" labels a checkbox, radio or switch beside it. */
  variant?: "field" | "choice";
  /** Stack the label text and its control with the standard gap. */
  stack?: boolean;
};

const variants = {
  field: "text-[13px] font-semibold leading-4 text-[color:var(--lms-neutral-400)]",
  choice: "text-sm font-normal text-[color:var(--lms-text-body)]",
} as const;

/** The one label style. Layout (grid, flex, widths) stays in className; typography never does. */
export function Label({ variant = "field", stack = false, className, ...props }: LabelProps) {
  return <label data-slot="label" data-variant={variant} {...props} className={cx(variants[variant], stack && "grid gap-1.5", className)} />;
}
