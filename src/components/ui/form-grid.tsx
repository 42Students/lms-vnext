import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type FormGridProps = ComponentPropsWithRef<"div"> & {
  /** Maximum number of columns at the legacy desktop breakpoint (992px). */
  columns?: 1 | 2 | 3;
  gap?: "sm" | "md" | "lg";
};

/**
 * Old LMS form rhythm: one field per row on phones (<=767px),
 * two on tablets and up to three only on desktop (>=992px).
 * The grid never changes field order, IDs, labels, or form state.
 */
export function FormGrid({
  columns = 2, gap = "md", className, children, ...props
}: FormGridProps) {
  return (
    <div {...props} data-slot="form-grid" data-columns={columns} data-gap={gap}
      className={cx("grid min-w-0 grid-cols-1 [&>*]:min-w-0", className)}>
      {children}
    </div>
  );
}
