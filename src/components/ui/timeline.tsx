import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

/** Semantic progression list; keeps timeline hairlines on the shared canvas. */
export function Timeline({ children, className, ...props }: ComponentPropsWithRef<"ol">) {
  return <ol {...props} data-slot="timeline"
    className={cx("relative space-y-5 border-l-2 border-[var(--lms-canvas-border)] pl-5", className)}>
    {children}
  </ol>;
}
export function TimelineEntry({ children, className, ...props }: ComponentPropsWithRef<"li">) {
  return <li {...props} data-slot="timeline-entry"
    className={cx("border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] last:border-b-0", className)}>
    {children}
  </li>;
}
