import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

/**
 * Shared, non-overlapping button row for adjacent actions. A group is not a
 * replacement for individual button labels or focus: children keep their
 * native semantics and all supported Button props.
 */
export type ButtonGroupProps = ComponentPropsWithRef<"div"> & {
  label: string;
};

export function ButtonGroup({ label, className, children, ...props }: ButtonGroupProps) {
  return (
    <div {...props} data-slot="button-group" role="group" aria-label={label}
      className={cx("inline-flex max-w-full min-w-0 items-stretch isolate [&>[data-slot=button]+[data-slot=button]]:-ml-px [&>[data-slot=button]:first-child:not(:last-child)]:rounded-r-none [&>[data-slot=button]:last-child:not(:first-child)]:rounded-l-none [&>[data-slot=button]:not(:first-child):not(:last-child)]:rounded-none [&>[data-slot=button]:focus-visible]:z-10 max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:[&>[data-slot=button]]:shrink-0", className)}>
      {children}
    </div>
  );
}
