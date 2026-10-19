import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";
import { ScrollCue } from "@/components/ui/scroll-cue";

export type TableProps = ComponentPropsWithRef<"table"> & {
  /** Optional for read-only audit tables; ordinary tables remain plain white. */
  striped?: boolean;
  scrollLabel?: string;
  containerClassName?: string;
};

/** Hairline row table for simple static collections; use DataTable for mobile row details. */
export function Table({ className, children, striped = false, scrollLabel, containerClassName, ...props }: TableProps) {
  return <div data-slot="table" className={cx("min-w-0 rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)] bg-surface", containerClassName)}>
    <ScrollCue axis="x" label={scrollLabel ?? (typeof props["aria-label"] === "string" ? props["aria-label"] : "Scrollable table columns")}>
      <table {...props} className={cx(striped && "[&_tbody_tr:nth-child(odd)]:bg-[var(--lms-table-header)]", "w-full border-collapse text-left text-[13px] leading-5 tabular-nums text-[var(--lms-body-text)] [&_thead]:bg-[var(--lms-table-header)] [&_th]:border-b [&_th]:border-[var(--lms-canvas-border)] [&_th]:px-[var(--lms-space-4)] [&_th]:py-[11px] [&_th]:text-[12px] [&_th]:leading-[18px] [&_th]:font-semibold [&_th]:text-[var(--lms-neutral-400)] [&_td]:border-b [&_td]:border-[var(--lms-canvas-border)] [&_td]:px-[var(--lms-space-4)] [&_td]:py-[10px] [&_td]:align-middle [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:hover]:bg-[var(--lms-table-hover)] [&_tbody_tr:focus-within]:bg-[var(--lms-primary-subtle)]", className)}>{children}</table>
    </ScrollCue>
  </div>;
}
