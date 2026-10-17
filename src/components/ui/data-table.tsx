import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
  mobileLabel?: string;
  mobilePriority?: "primary" | "secondary" | "hidden";
};
export type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  empty?: ReactNode;
  caption?: string;
  rowHref?: (row: Row) => string;
};

export function DataTable<Row>({ columns, rows, getRowKey, empty, caption, rowHref }: DataTableProps<Row>) {
  if (rows.length === 0) return <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
    {empty ?? <p className="m-0 text-sm text-muted-foreground">No records found.</p>}
  </div>;
  const primary = columns.find(column => column.mobilePriority === "primary") ?? columns.find(column => column.mobilePriority !== "hidden");
  const secondary = columns.filter(column => column.key !== primary?.key && column.mobilePriority !== "hidden");
  return <div data-slot="data-table" className="min-w-0">
    <div className="space-y-3 sm:hidden" role="list" aria-label={caption ?? "Records"}>
      {rows.map(row => (
        <article key={getRowKey(row)} role="listitem" className="min-w-0 rounded-xl border border-border bg-surface p-4">
          {primary ? <h3 className="break-words text-base font-semibold leading-6 text-foreground">{primary.cell(row)}</h3> : null}
          {secondary.length ? <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 text-sm leading-5">
            {secondary.map(column => <div key={column.key} className="min-w-0"><dt className="font-medium text-body">{column.mobileLabel ?? column.header}</dt>
              <dd className="mt-0.5 min-w-0 break-words text-foreground">{column.cell(row)}</dd></div>)}
          </dl> : null}
          {rowHref ? <a href={rowHref(row)} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">View details</a> : null}
        </article>
      ))}
    </div>
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface sm:block">
      <table className="w-full border-collapse text-left text-sm leading-5">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-muted">
          <tr>{columns.map(column => <th key={column.key} scope="col" className={cx("sticky top-0 z-10 border-b border-border bg-muted px-4 py-3 font-semibold text-body", column.className)}>{column.header}</th>)}</tr>
        </thead>
        <tbody>{rows.map(row => <tr key={getRowKey(row)} className="border-b border-border last:border-b-0 hover:bg-primary-subtle/60">
          {columns.map(column => <td key={column.key} className={cx("px-4 py-3 align-middle text-body", column.className)}>{column.cell(row)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
