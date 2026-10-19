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
      className={cx("inline-flex max-w-full min-w-0 items-stretch isolate", className)}>
      {children}
    </div>
  );
}
