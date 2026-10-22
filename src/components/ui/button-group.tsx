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

const buttonGroupBaseClass = "inline-flex max-w-full min-w-0 items-stretch isolate align-middle [&>[data-slot=button]+[data-slot=button]]:-ml-px [&>[data-slot=button]:first-child:not(:last-child)]:rounded-r-none [&>[data-slot=button]:last-child:not(:first-child)]:rounded-l-none [&>[data-slot=button]:not(:first-child):not(:last-child)]:rounded-none [&>[data-slot=button]:focus-visible]:z-10 max-[767px]:w-full max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:scroll-px-1 max-[767px]:[&>[data-slot=button]]:min-h-11 max-[767px]:[&>[data-slot=button]]:shrink-0";

export function ButtonGroup({ label, className, children, ...props }: ButtonGroupProps) {
  return (
    <div {...props} data-slot="button-group" role="group" aria-label={label}
      className={cx(buttonGroupBaseClass, className)}>
      {children}
    </div>
  );
}
