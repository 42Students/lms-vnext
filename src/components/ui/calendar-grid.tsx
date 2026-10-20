import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type CalendarGridProps = ComponentPropsWithRef<"div"> & {
  /** Hairline = legacy 1px separator grid; spaced = mobile-friendly date cards. */
  variant?: "hairline" | "spaced";
};

/** Shared seven-day calendar shell; callers own dates, events, timezone and navigation. */
export function CalendarGrid({
  variant = "spaced", className, children, ...props
}: CalendarGridProps) {
  return (
    <div
      data-slot="calendar-grid"
      className={cx(
        "grid grid-cols-7 max-[767px]:overflow-x-auto max-[767px]:[grid-template-columns:repeat(7,minmax(44px,1fr))]",
        variant === "hairline"
          ? "gap-px rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-200)]"
          : "gap-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
