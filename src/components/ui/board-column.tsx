import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type BoardColumnProps = ComponentPropsWithRef<"section"> & {
  label: string;
};

/** Shared board lane surface, preserving callers' drag/drop and focus handlers. */
export function BoardColumn({ label, className, children, ...props }: BoardColumnProps) {
  return (
    <section
      data-slot="board-column"
      aria-label={label}
      className={cx(
        "w-72 shrink-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-3",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
