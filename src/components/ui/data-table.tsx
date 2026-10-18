import type { ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/lib/class-names";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
  mobileLabel?: string;
  mobilePriority?: "primary" | "secondary" | "action" | "hidden";
  /** Legacy rationale alone is NOT proof that the detail renders this field. */
  mobileHiddenReason?: string;
  /** Audited column-level mapping to a field on a permission-authorized detail route.
   * If absent or denied for any row, the field remains inside More details.
   */
  mobileDetail?: {
    fieldKey: string;
    href: (row: Row) => string;
    canView: (row: Row) => boolean;
  };
};
export type DataTableProps<Row> = {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  /** Required: caller-owned legacy empty state and authorized recovery action. */
  empty: ReactNode;
  caption?: string;
  rowHref?: (row: Row) => string;
};

export function DataTable<Row>({ columns, rows, getRowKey, empty, caption, rowHref }: DataTableProps<Row>) {
  if (rows.length === 0) return <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
    {empty}
  </div>;
  // A generic rowHref is never proof a hidden field exists on the detail route.
  const detailHrefs = rows.map(row => {
    const href = rowHref?.(row);
    return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") && href.length > 1 ? href : null;
  });
  const mappedToAuthorizedDetail = (column: DataTableColumn<Row>) => {
    if (column.mobilePriority !== "hidden" || !column.mobileHiddenReason || !column.mobileDetail?.fieldKey.trim()) return false;
    return rows.every(row => {
      if (!column.mobileDetail?.canView(row)) return false;
      const href = column.mobileDetail.href(row);
      return href.startsWith("/") && !href.startsWith("//") && href.length > 1;
    });
  };
  const primary = columns.find(column => column.mobilePriority === "primary") ??
    columns.find(column => column.mobilePriority === undefined || column.mobilePriority === "secondary");
  const actions = columns.filter(column => column.mobilePriority === "action");
  const secondary = columns.filter(column => column.key !== primary?.key && column.mobilePriority !== "action" &&
    !mappedToAuthorizedDetail(column));
  const mapped = columns.filter(mappedToAuthorizedDetail);
  const shown = secondary.slice(0, 3);
  const extra = secondary.slice(3);
  // Evaluate expensive row cell formatters once, then reuse the results in
  // both responsive semantics. Caller paginates beyond 100 rows.
  const prepared = rows.map((row, index) => ({
    detailHref: detailHrefs[index],
    key: getRowKey(row),
    row,
    cells: new Map(columns.map(column => [column.key, column.cell(row)] as const)),
  }));
  const cell = (item: (typeof prepared)[number], column: DataTableColumn<Row>): ReactNode =>
    item.cells.get(column.key);
  return <div data-slot="data-table" className="min-w-0">
    <div className="space-y-3 sm:hidden" role="list" aria-label={caption ?? "Records"}>
      {prepared.map(item => (
        <article key={item.key} role="listitem" className="min-w-0 rounded-xl border border-border bg-surface p-4">
          {primary ? (() => {
            const content = cell(item,primary);
            return typeof content === "string" || typeof content === "number"
              ? <h3 className="min-w-0 break-words text-base font-semibold leading-6 text-foreground">{content}</h3>
              : <div className="min-w-0 break-words text-base font-semibold leading-6 text-foreground">{content}</div>;
          })() : null}
          {shown.length ? <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 text-sm leading-5">
            {shown.map(column => <div key={column.key} className="min-w-0"><dt className="font-medium text-body">{column.mobileLabel ?? column.header}</dt>
              <dd className="mt-0.5 min-w-0 break-words text-foreground">{cell(item,column)}</dd></div>)}
          </dl> : null}
          {extra.length ? <details className="mt-3 border-t border-border pt-2"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-[var(--lms-teal-deep)]">More details</summary><dl className="grid gap-2 text-sm">{extra.map(column => <div key={column.key} className="min-w-0"><dt className="text-body">{column.mobileLabel ?? column.header}</dt><dd className="min-w-0 break-words text-foreground">{cell(item,column)}</dd></div>)}</dl></details> : null}
          {actions.length ? <div className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-border pt-3" aria-label="Row actions">
            {actions.map(column => <div key={column.key} className="min-w-0">{cell(item,column)}</div>)}
          </div> : null}
          {item.detailHref ? <Link href={item.detailHref} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">View details</Link> : null}
        </article>
      ))}
    </div>
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface sm:block">
      <table className="w-full border-collapse text-left text-sm leading-5">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-muted">
          <tr>{columns.map(column => <th key={column.key} scope="col" className={cx("sticky top-0 z-10 border-b border-border bg-muted px-4 py-3 font-semibold text-body", column.className)}>{column.header}</th>)}</tr>
        </thead>
        <tbody>{prepared.map(item => <tr key={item.key} className="border-b border-border last:border-b-0 hover:bg-primary-subtle/60">
          {columns.map(column => <td key={column.key} className={cx("px-4 py-3 align-middle text-body", column.className)}>{cell(item,column)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
