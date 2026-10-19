import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type BoardColumnProps = ComponentPropsWithRef<"section"> & {
  label: string;
  width?: "compact" | "default";
};

/** Shared board lane surface, preserving callers' drag/drop and focus handlers. */
export function BoardColumn({ label, width = "default", className, children, ...props }: BoardColumnProps) {
  return (
    <section
      data-slot="board-column"
      aria-label={label}
      className={cx(
        "shrink-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-3",
        width === "compact" ? "w-64" : "w-72",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
