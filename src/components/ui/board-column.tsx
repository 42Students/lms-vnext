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
        "shrink-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-[var(--lms-space-4)] focus-within:border-[var(--lms-primary)] focus-within:shadow-[0_0_0_4px_rgba(26,149,161,0.12)]",
        width === "compact" ? "w-64" : "w-72",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
