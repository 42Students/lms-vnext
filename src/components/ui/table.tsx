import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type TableProps = ComponentPropsWithRef<"table">;

/** Hairline row table for simple static collections; use DataTable for mobile row details. */
export function Table({ className, children, ...props }: TableProps) {
  return <div data-slot="table" className="min-w-0 overflow-x-auto rounded-[10px] border border-[#e5e9f0] bg-white">
    <table {...props} className={cx("w-full border-collapse text-left text-[13px] leading-5 tabular-nums [&_thead]:bg-[#fafbfc] [&_th]:border-b [&_th]:border-[#e5e9f0] [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-xs [&_th]:font-semibold [&_th]:text-[#54505d] [&_td]:border-b [&_td]:border-[#e5e9f0] [&_td]:px-4 [&_td]:py-2.5 [&_tbody_tr:hover]:bg-[#eff8fa]", className)}>{children}</table>
  </div>;
}
