import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type TableProps = ComponentPropsWithRef<"table">;

/** Hairline row table for simple static collections; use DataTable for mobile row details. */
export function Table({ className, children, ...props }: TableProps) {
  return <div data-slot="table" className="min-w-0 overflow-x-auto rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)] bg-white">
    <table {...props} className={cx("w-full border-collapse text-left text-[13px] leading-5 tabular-nums [&_thead]:bg-[var(--lms-table-header)] [&_th]:border-b [&_th]:border-[var(--lms-canvas-border)] [&_th]:px-[var(--lms-space-4)] [&_th]:py-[11px] [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[var(--lms-neutral-400)] [&_td]:border-b [&_td]:border-[var(--lms-canvas-border)] [&_td]:px-[var(--lms-space-4)] [&_td]:py-2.5 [&_tbody_tr:hover]:bg-[rgba(38,186,199,0.045)]", className)}>{children}</table>
  </div>;
}
