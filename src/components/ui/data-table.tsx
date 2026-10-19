import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Disclosure } from "@/components/ui/disclosure";
import { cx } from "@/lib/class-names";
import { isSafeInternalHref } from "@/lib/safe-internal-href";

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
  className?: string;
};

/** Backwards-compatible export for existing DataTable consumers and tests. */
export { isSafeInternalHref as isSafeDataTableHref } from "@/lib/safe-internal-href";

export function DataTable<Row>({ columns, rows, getRowKey, empty, caption, rowHref, className }: DataTableProps<Row>) {
  if(rows.length===0) return <div data-slot="data-table" aria-label={caption} className={cx("rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)] sm:p-[var(--lms-canvas-padding)]", className)}>{empty}</div>;
  const primary=columns.find(col=>col.mobilePriority==="primary") ??
    columns.find(col=>col.mobilePriority===undefined || col.mobilePriority==="secondary");
  const actions=columns.filter(col=>col.mobilePriority==="action");
  // Access is evaluated PER ROW. A single denied record must not turn a
  // hidden field into a mobile "More details" fallback for every record.
  const recoverable=columns.filter(col=>col.mobilePriority==="hidden" &&
    Boolean(col.mobileHiddenReason && col.mobileDetail?.fieldKey.trim()));
  const secondary=columns.filter(col=>col.key!==primary?.key &&
    col.mobilePriority!=="action" && col.mobilePriority!=="hidden");
  const shown=secondary.slice(0,3);
  // A column explicitly marked "hidden" must never be reintroduced by the
  // mobile More details disclosure. If access can be recovered, a guarded
  // mobileDetail link is rendered independently below; otherwise it stays
  // hidden on phones, even though its desktop cell may still be visible.
  const extra=secondary.slice(3);
  const visibleOnPhone=new Set([primary?.key,...shown.map(c=>c.key),...actions.map(c=>c.key)]);
  // One row/column DOM tree, one cell formatter call: no duplicated 100-row
  // responsive subtree. Only collapsed secondary fields are repeated in
  // the accessible More details disclosure where the phone requires them.
  const prepared=rows.map(row=>{
    const detailAccess=new Map(columns.filter(col=>col.mobileDetail).map(col=>{
      // Permission resolvers must fail closed, not crash a whole tenant list or
      // accidentally permit a hidden formatter after throwing.
      let permitted=false;
      try { permitted=col.mobileDetail!.canView(row)===true; }
      catch { permitted=false; }
      return [col.key, permitted] as const;
    }));
    const detailLinks=new Map(recoverable.map(col=>{
      let href:string|null=null;
      if(detailAccess.get(col.key)){
        try {
          const candidate=col.mobileDetail!.href(row);
          if(isSafeInternalHref(candidate) && candidate.length>1) href=candidate;
        } catch { href=null; }
      }
      return [col.key,href] as const;
    }));
    return {
      key:getRowKey(row),row,detailLinks,
      detailHref:(()=>{
        try {
          const href=rowHref?.(row);
          return href && isSafeInternalHref(href) ? href : null;
        } catch { return null; }
      })(),
      // Never evaluate or serialize a hidden restricted formatter for an
      // actor who cannot view the linked field.
      cells:new Map(columns.map(col=>[col.key,
        col.mobilePriority==="hidden" && col.mobileDetail && !detailAccess.get(col.key)
          ? null : col.cell(row)] as const)),
    };
  });
  const cell=(item:(typeof prepared)[number],col:DataTableColumn<Row>)=>item.cells.get(col.key);
  return <div data-slot="data-table" className={cx("min-w-0", className)}>
    <ScrollCue axis="x" label={caption ? caption+" scrollable columns" : "Scrollable table columns"} className="min-w-0 sm:rounded-[var(--lms-radius-md)] sm:border sm:border-[var(--lms-canvas-border)]">
      <table className="block w-full border-separate border-spacing-0 text-left text-[13px] leading-5 tabular-nums sm:table sm:border-collapse sm:[&_tbody_tr:last-child_td]:border-b-0">
        <caption className="sr-only">{caption ?? "Records"}</caption>
        <thead className="hidden sm:table-header-group sm:bg-[var(--lms-table-header)]">
          <tr>{columns.map(col=><th key={col.key} scope="col"
            className={cx("border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[11px] text-xs font-semibold leading-[18px] text-[var(--lms-neutral-400)] sm:sticky sm:top-0 sm:z-10 sm:bg-[var(--lms-table-header)] sm:first:left-0 sm:first:z-20",col.className)}>{col.header}</th>)}</tr>
        </thead>
        <tbody className="block space-y-[var(--lms-space-3)] sm:table-row-group sm:space-y-0">
          {prepared.map(item=><tr key={item.key} data-slot="data-table-row"
            className="block min-w-0 overflow-hidden rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)] sm:table-row sm:overflow-visible sm:rounded-none sm:border-0 sm:p-0 sm:transition-colors sm:duration-[var(--lms-motion-fast)] sm:hover:bg-[var(--lms-table-hover)] focus-within:border-[var(--lms-primary)] sm:focus-within:border-[var(--lms-canvas-border)] sm:focus-within:bg-[var(--lms-primary-subtle)] motion-reduce:transition-none">
            {columns.map(col=>{
              const phoneVisible=visibleOnPhone.has(col.key);
              const content=cell(item,col);
              return <td key={col.key} className={cx(
                "min-w-0 break-words py-1 text-body sm:table-cell sm:border-b sm:border-[var(--lms-canvas-border)] sm:px-[var(--lms-space-4)] sm:py-[10px] sm:align-middle sm:first:sticky sm:first:left-0 sm:first:z-10 sm:first:bg-inherit",
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
              <Disclosure title="More details" className="mt-2 pt-2">
                <dl className="grid gap-[var(--lms-space-2)] text-[13px] leading-5">{extra.map(col=><div key={col.key} className="min-w-0">
                  <dt className="font-medium text-body">{col.mobileLabel??col.header}</dt>
                  <dd className="break-words text-foreground">{cell(item,col)}</dd>
                </div>)}</dl>
              </Disclosure>
            </td>:null}
            {[...item.detailLinks.values()].some(Boolean) ? <td className="block min-w-0 py-1 sm:hidden">
              <ul className="space-y-[var(--lms-space-2)]" aria-label="Fields on detail page">
                {recoverable.filter(col=>item.detailLinks.get(col.key)).map(col=>
                  <li key={col.key}><Link href={item.detailLinks.get(col.key)!}
                    className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
                    {col.mobileLabel??col.header} · View details
                  </Link></li>)}
              </ul>
            </td>:null}
            {item.detailHref ? <td className="block min-w-0 py-1 sm:hidden">
              <Link href={item.detailHref} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">View details</Link>
            </td>:null}
          </tr>)}
        </tbody>
      </table>
    </ScrollCue>
  </div>;
}
