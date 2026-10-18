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
  mobileHiddenReason?: string;
  /** Audited field mapping. No generic rowHref counts as evidence. */
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
  /** Required legacy-scoped empty copy with an authorized recovery action. */
  empty: ReactNode;
  caption?: string;
  rowHref?: (row: Row) => string;
};

export function DataTable<Row>({ columns, rows, getRowKey, empty, caption, rowHref }: DataTableProps<Row>) {
  if(rows.length===0) return <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">{empty}</div>;
  const primary=columns.find(col=>col.mobilePriority==="primary") ??
    columns.find(col=>col.mobilePriority===undefined || col.mobilePriority==="secondary");
  const actions=columns.filter(col=>col.mobilePriority==="action");
  const mapped=(col:DataTableColumn<Row>)=>col.mobilePriority==="hidden" &&
    Boolean(col.mobileHiddenReason && col.mobileDetail?.fieldKey.trim()) &&
    rows.every(row=>{
      if(!col.mobileDetail?.canView(row))return false;
      const href=col.mobileDetail.href(row);
      return href.startsWith("/") && !href.startsWith("//") && href.length>1;
    });
  const recoverable=columns.filter(mapped);
  const secondary=columns.filter(col=>col.key!==primary?.key && col.mobilePriority!=="action" && !mapped(col));
  const shown=secondary.slice(0,3);
  const extra=secondary.slice(3);
  const visibleOnPhone=new Set([primary?.key,...shown.map(c=>c.key),...actions.map(c=>c.key)]);
  // One row/column DOM tree, one cell formatter call: no duplicated 100-row
  // responsive subtree. Only collapsed secondary fields are repeated in
  // the accessible More details disclosure where the phone requires them.
  const prepared=rows.map(row=>({
    key:getRowKey(row),row,
    detailHref:(()=>{
      const href=rowHref?.(row);
      return href && href.startsWith("/") && !href.startsWith("//") ? href : null;
    })(),
    cells:new Map(columns.map(col=>[col.key,col.cell(row)] as const)),
  }));
  const cell=(item:(typeof prepared)[number],col:DataTableColumn<Row>)=>item.cells.get(col.key);
  return <div data-slot="data-table" className="min-w-0">
    <div className="min-w-0 sm:overflow-x-auto sm:rounded-xl sm:border sm:border-border">
      <table className="block w-full border-separate border-spacing-0 text-left text-sm leading-5 sm:table sm:border-collapse">
        <caption className="sr-only">{caption ?? "Records"}</caption>
        <thead className="sr-only sm:table-header-group sm:bg-muted">
          <tr>{columns.map(col=><th key={col.key} scope="col"
            className={cx("border-b border-border px-4 py-3 font-semibold text-body sm:sticky sm:top-0 sm:z-10 sm:bg-muted",col.className)}>{col.header}</th>)}</tr>
        </thead>
        <tbody className="block space-y-3 sm:table-row-group sm:space-y-0">
          {prepared.map(item=><tr key={item.key}
            className="block min-w-0 overflow-hidden rounded-xl border border-border bg-surface p-4 sm:table-row sm:overflow-visible sm:rounded-none sm:border-0 sm:p-0 sm:hover:bg-primary-subtle/60">
            {columns.map(col=>{
              const phoneVisible=visibleOnPhone.has(col.key);
              const content=cell(item,col);
              return <td key={col.key} className={cx(
                "min-w-0 break-words py-1 text-body sm:table-cell sm:border-b sm:border-border sm:px-4 sm:py-3 sm:align-middle",
                phoneVisible?"block":"hidden",col.className,
              )}>
                {phoneVisible && col.mobilePriority!=="action" ?
                  <span className="mr-2 font-medium text-body sm:hidden">{col.mobileLabel??col.header}</span>:null}
                {col===primary && (typeof content==="string"||typeof content==="number")
                  ? <strong className="break-words text-base text-foreground sm:text-sm">{content}</strong>
                  : content}
              </td>;
            })}
            {extra.length ? <td className="block min-w-0 py-1 sm:hidden">
              <details className="mt-2 border-t border-border pt-2">
                <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-[var(--lms-teal-deep)]">More details</summary>
                <dl className="grid gap-2 text-sm">{extra.map(col=><div key={col.key} className="min-w-0">
                  <dt className="font-medium text-body">{col.mobileLabel??col.header}</dt>
                  <dd className="break-words text-foreground">{cell(item,col)}</dd>
                </div>)}</dl>
              </details>
            </td>:null}
            {recoverable.length ? <td className="block min-w-0 py-1 sm:hidden">
              <ul className="space-y-2" aria-label="Fields on detail page">
                {recoverable.map(col=><li key={col.key}><Link href={col.mobileDetail!.href(item.row)}
                  className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">
                  {col.mobileLabel??col.header} · View details
                </Link></li>)}
              </ul>
            </td>:null}
            {item.detailHref ? <td className="block min-w-0 py-1 sm:hidden">
              <Link href={item.detailHref} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">View details</Link>
            </td>:null}
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}
