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
  /** Native table sorting semantics; visual sort controls stay in the column header. */
  sortDirection?: "ascending" | "descending" | "none";
  /** Optional URL-driven column sort; caller must sort rows on the server. */
  sortable?: boolean;
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
  /** Legacy dense tables keep every column reachable on a narrow viewport. */
  mobileMode?: "cards"|"scroll";
  /** Safe same-origin URL for the *next* sort state. Query params persist state. */
  sortHref?: (columnKey: string, next: "ascending" | "descending") => string;
  /** Native form-based multi-selection; no client-only handler is required. */
  rowSelection?: {
    formId: string;
    action: string;
    method?: "get" | "post";
    fieldName?: string;
    isDisabled?: (row: Row) => boolean;
    controls: ReactNode;
  };
};

/** Backwards-compatible export for existing DataTable consumers and tests. */
export { isSafeInternalHref as isSafeDataTableHref } from "@/lib/safe-internal-href";

export function DataTable<Row>({ columns, rows, getRowKey, empty, caption, rowHref, className, sortHref, rowSelection, mobileMode = "scroll" }: DataTableProps<Row>) {
  if(rows.length===0) return <div data-slot="data-table" aria-label={caption} className={cx("rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)] md:p-[var(--lms-canvas-padding)]", className)}>{empty}</div>;
  // Native form association keeps this component usable in Server Components:
  // checkboxes join a form by stable caller-owned ID without a client boundary.
  const selection = rowSelection && rowSelection.formId.trim() &&
    isSafeInternalHref(rowSelection.action) ? rowSelection : null;
  const sortLinks = new Map(columns.map(col=>{
    if(!col.sortable || !sortHref) return [col.key,null] as const;
    try {
      const next = col.sortDirection==="ascending"?"descending":"ascending";
      const candidate = sortHref(col.key,next);
      return [col.key,isSafeInternalHref(candidate)?candidate:null] as const;
    } catch { return [col.key,null] as const; }
  }));
  const horizontal=mobileMode==="scroll";
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
      selectable:(()=>{
        if(!selection) return false;
        try { return selection.isDisabled?.(row)!==true; }
        catch { return false; }
      })(),
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
    <ScrollCue axis="x" label={caption ? caption+" scrollable columns" : "Scrollable table columns"} className="min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]">
      <table className={cx("w-full border-separate border-spacing-0 text-left text-[14px] leading-5 tabular-nums md:table md:border-collapse md:[&_tbody_tr:last-child_td]:border-b-0",
          horizontal?"table min-w-[860px] border-collapse":"block")}>
        <caption className="sr-only">{caption ?? "Records"}</caption>
        <thead className={cx("md:table-header-group md:bg-[var(--lms-white)]",horizontal?"table-header-group bg-surface":"hidden")}>
          <tr>
            {selection ? <th scope="col" className="border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[11px] md:sticky md:top-0 md:z-10 md:bg-[var(--lms-white)]">
              <span className="sr-only">Select records</span>
            </th> : null}
            {columns.map(col=><th key={col.key} scope="col" aria-sort={col.sortDirection}
              className={cx("border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[11px] text-xs font-semibold leading-[18px] text-[var(--lms-neutral-400)] md:sticky md:top-0 md:z-10 md:bg-[var(--lms-white)] md:first:left-0 md:first:z-20",col.className)}>
              {sortLinks.get(col.key) ? <Link href={sortLinks.get(col.key)!}
                aria-label={"Sort by "+col.key+(col.sortDirection==="ascending"?" descending":" ascending")}
                className="inline-flex items-center gap-2 rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
                {col.header}<span aria-hidden="true">{col.sortDirection==="ascending"?"▲":col.sortDirection==="descending"?"▼":"↕"}</span>
              </Link> : col.header}
            </th>)}
          </tr>
        </thead>
        <tbody className={cx("md:table-row-group md:space-y-0",horizontal?"table-row-group":"block space-y-[var(--lms-space-3)]")}>
          {prepared.map(item=><tr key={item.key} data-slot="data-table-row"
            className={cx("min-w-0 bg-surface md:table-row md:overflow-visible md:rounded-none md:border-0 md:p-0 md:transition-colors md:duration-[var(--lms-motion-fast)] md:hover:bg-[var(--lms-white)] focus-within:border-[var(--lms-primary)] md:focus-within:border-[var(--lms-canvas-border)] md:focus-within:bg-[var(--lms-primary-subtle)] motion-reduce:transition-none",
              horizontal?"table-row border-0 p-0":"block overflow-hidden rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] p-[var(--lms-space-4)]")}>
            {selection ? <td className={cx("py-1 md:table-cell md:border-b md:border-[var(--lms-canvas-border)] md:px-[var(--lms-space-4)]",horizontal?"table-cell px-3":"block")}>
              <input type="checkbox" name={selection.fieldName??"selected"} value={item.key}
                form={selection.formId} disabled={!item.selectable}
                aria-label={"Select record "+item.key}
                className="size-4 accent-[var(--lms-primary)] disabled:opacity-50"/>
            </td> : null}
            {columns.map(col=>{
              const phoneVisible=visibleOnPhone.has(col.key);
              const content=cell(item,col);
              return <td key={col.key} className={cx(
                "min-w-0 break-words py-1 text-body md:table-cell md:border-b md:border-[var(--lms-canvas-border)] md:px-[var(--lms-space-4)] md:py-[12px] md:align-middle md:first:sticky md:first:left-0 md:first:z-10 md:first:bg-inherit",
                horizontal?"table-cell border-b border-border px-3 py-3 align-middle":phoneVisible?"block":"hidden",col.className,
              )}>
                {!horizontal && phoneVisible && col.mobilePriority!=="action" ?
                  <span className="mr-2 font-medium text-body md:hidden">{col.mobileLabel??col.header}</span>:null}
                {col===primary && (typeof content==="string"||typeof content==="number")
                  ? <strong className="break-words text-sm font-semibold leading-5 text-[var(--lms-heading)]">{content}</strong>
                  : content}
              </td>;
            })}
            {!horizontal && extra.length ? <td className="block min-w-0 py-1 md:hidden">
              <Disclosure title="More details" className="mt-2 pt-2">
                <dl className="grid gap-[var(--lms-space-2)] text-[13px] leading-[22px]">{extra.map(col=><div key={col.key} className="min-w-0">
                  <dt className="font-medium text-body">{col.mobileLabel??col.header}</dt>
                  <dd className="break-words text-foreground">{cell(item,col)}</dd>
                </div>)}</dl>
              </Disclosure>
            </td>:null}
            {!horizontal && [...item.detailLinks.values()].some(Boolean) ? <td className="block min-w-0 py-1 md:hidden">
              <ul className="space-y-[var(--lms-space-2)]" aria-label="Fields on detail page">
                {recoverable.filter(col=>item.detailLinks.get(col.key)).map(col=>
                  <li key={col.key}><Link href={item.detailLinks.get(col.key)!}
                    className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                    {col.mobileLabel??col.header} · View details
                  </Link></li>)}
              </ul>
            </td>:null}
            {!horizontal && item.detailHref ? <td className="block min-w-0 py-1 md:hidden">
              <Link href={item.detailHref} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View details</Link>
            </td>:null}
          </tr>)}
        </tbody>
      </table>
    </ScrollCue>
    {selection ? <form id={selection.formId} method={selection.method??"post"}
      action={selection.action} className="mt-3 flex min-h-11 items-center gap-2">
      {selection.controls}
    </form> : null}
  </div>;
}
