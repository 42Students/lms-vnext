"use client";

import { Select } from "@/components/ui/select";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Disclosure } from "@/components/ui/disclosure";
import { DepartmentActions } from "@/components/admin/department-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  departmentRowsCsv,
  filterDepartmentRows,
  pageDepartmentRows,
  type DepartmentDirectoryRow,
} from "@/modules/admin-ui/department-directory";

function countText(value:number|null|undefined){return value==null?"—":String(value);}
function usageChip(label:string,value:number|null|undefined){
 return <span className="inline-flex min-h-7 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
  tabIndex={0} role="note" aria-label={value==null?
   label+" count unavailable; refresh before archiving.":value+" active "+label}
  title={value==null?"Dependency count unavailable; refresh before archiving.":value+" active "+label}>
  <StatusBadge tone={value==null?"warning":value>0?"info":"neutral"}>
   {countText(value)} {label}
  </StatusBadge>
 </span>;
}

const columns: DataTableColumn<DepartmentDirectoryRow>[] = [
  {
    key: "name",
    header: "Department Name",
    mobileLabel: "Department Name",
    mobilePriority: "primary",
    cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
  },
  {
    key: "usage",
    header: "Contents",
    mobilePriority: "secondary",
    cell: (row) => (
      <span className="flex flex-wrap gap-1.5" title={row.usage?
       "Active linked records; resolve all dependencies before deleting this department.":
       "Usage counts unavailable; delete remains blocked until dependencies can be checked."}>
        {([["Programs",row.usage?.programs],["Courses",row.usage?.courses],
          ["Faculty",row.usage?.faculty]] as const).map(([label,count])=>
          <span key={label} className="inline-flex rounded border border-info bg-info-subtle px-2 py-0.5 text-xs font-medium text-info-text">
            {countText(count)} {label}
          </span>)}
      </span>
    ),
  },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    mobilePriority: "action",
    className: "text-right",
    cell: (row) => <DepartmentActions departmentId={row.id} name={row.name} usage={row.usage} />,
  },
];

export function DepartmentDirectory({
  rows,
}: {
  rows: readonly DepartmentDirectoryRow[];
}) {
  const router=useRouter();
  const [search, setSearch] = useState("");
  const router=useRouter();
  const [refreshing,startRefresh]=useTransition();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nameOrder, setNameOrder] = useState<"ASC" | "DESC">("ASC");
  const ordered = filterDepartmentRows(rows, search);
  const filtered = nameOrder === "DESC" ? [...ordered].reverse() : ordered;
  const result = pageDepartmentRows(filtered, page, pageSize);
  const exportHref = "data:text/csv;charset=utf-8," +
    encodeURIComponent("\ufeff" + departmentRowsCsv(filtered));

  return (
    <section className="min-w-0 space-y-[var(--lms-space-3)]" aria-label={DEPARTMENT_COPY.existingTitle}>
      <div className="-mx-4 -mt-1 flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--lms-canvas-border)] px-4 pb-4 print:hidden">
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">{DEPARTMENT_COPY.existingTitle}</h2>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="relative min-w-0 w-full sm:w-[220px]">
            <label htmlFor="department-directory-search" className="sr-only">Search departments</label>
            <Input id="department-directory-search" type="search" placeholder="Search departments"
              value={search} className="min-h-11 w-full pr-12 md:min-h-9"
              onChange={event=>{setSearch(event.target.value);setPage(1);}}/>
            {search?<button type="button" title="Clear search" aria-label="Clear search" onClick={()=>{setSearch("");setPage(1);}}
              className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">×</button>:
              <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>}
          </div>
          {filtered.length?<a href={exportHref} download="departments.csv"
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link hover:bg-primary-subtle md:min-h-9">
            <span aria-hidden="true">↓</span> Export CSV
          </a>:<Button size="sm" variant="secondary" disabled>Export CSV</Button>}
          <Button type="button" variant="secondary" size="sm" loading={refreshing} disabled={refreshing}
            onClick={()=>startRefresh(()=>router.refresh())} title="Reload the selected college's departments">
            <span aria-hidden="true">↻</span> {refreshing?"Refreshing…":"Refresh"}
          </Button>
        </div>
        {search.trim() ? <Button size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
          onClick={() => { setSearch(""); setPage(1); }}>Clear search</Button> : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          {filtered.length ? <a href={exportHref} download="departments.csv"
            className="inline-flex min-h-11 items-center rounded border border-border bg-surface px-3 text-sm font-semibold text-link md:min-h-9">Export CSV</a>:
            <Button variant="secondary" disabled>Export CSV</Button>}
          <Button type="button" variant="secondary" onClick={()=>router.refresh()} className="min-h-11 md:min-h-9">Refresh</Button>
        </div>
        <Disclosure title="View options" className="min-w-0 sm:col-span-2"
          contentClassName="flex min-w-0 flex-col gap-3 pb-3 pt-2 sm:min-w-48">
          <label htmlFor="department-directory-page-size"
            className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Rows per page
            <Select id="department-directory-page-size" value={pageSize}
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
              className="min-h-11 w-full md:min-h-9">
              {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </Select>
          </label>
          {filtered.length ? (
            <a href={exportHref} download="departments.csv"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
              Export CSV
            </a>
          ) : <Button size="sm" variant="secondary" disabled>Export CSV</Button>}
        </Disclosure>
      </div>
      <p role="status" aria-live="polite" className="text-sm leading-[22px] text-muted-foreground">
        Departments retrieved · {result.total} of {rows.length} {rows.length === 1 ? "result" : "results"}
      </p>
      {result.items.length?<div role="region" aria-label="Existing departments table" tabIndex={0}
        className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        <table className="w-full min-w-[660px] border-collapse text-left text-sm leading-5">
          <caption className="sr-only">Departments and dependency counts; scroll horizontally to see all columns</caption>
          <thead className="bg-[var(--lms-neutral-50)] text-xs text-muted-foreground"><tr>
            <th scope="col" aria-sort={nameOrder==="ASC"?"ascending":"descending"}
              className="border-b border-border px-3 py-2 font-semibold">
              <Button type="button" variant="ghost" aria-label="Sort Department Name" size="sm"
                onClick={()=>{setNameOrder(nameOrder==="ASC"?"DESC":"ASC");setPage(1);}}>
                Department Name {nameOrder==="ASC"?"↑":"↓"}
              </Button>
            </th>
            <th scope="col" className="border-b border-border px-3 py-2 font-semibold">Contents</th>
            <th scope="col" className="w-[160px] border-b border-border px-3 py-2 text-right font-semibold">Actions</th>
          </tr></thead>
          <tbody>{result.items.map(row=><tr key={row.id} className="border-b border-border align-middle last:border-b-0 hover:bg-[var(--lms-neutral-50)]">
            <th scope="row" className="min-w-[145px] break-words px-3 py-3 font-semibold text-foreground">{row.name}</th>
            <td className="min-w-[250px] px-3 py-3">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {usageChip(row.usage?.programs===1?"program":"programs",row.usage?.programs)}
                {usageChip(row.usage?.courses===1?"course":"courses",row.usage?.courses)}
                {usageChip("faculty",row.usage?.faculty)}
              </div>
            </td>
            <td className="px-3 py-3 text-right">
              <DepartmentActions departmentId={row.id} name={row.name} usage={row.usage}/>
            </td>
          </tr>)}</tbody>
        </table>
      </div>:<div role="status" className="rounded-[var(--lms-control-radius)] border border-border p-4 text-sm text-muted-foreground">
        {search.trim()?"No departments match this search.":"No departments found. Create a department to get started."}
      </div>}
      {rows.some((row) => row.usage === null) ? (
        <p className="text-xs text-muted-foreground leading-5" role="status">
          Some dependency counts are unavailable. They are shown as —, not zero.
          Refresh to retry; archiving remains checked by the server.
        </p>
      ) : null}
      {result.total > 0 ? (
        <div className="flex flex-col items-stretch justify-between gap-3 text-sm text-muted-foreground print:hidden sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span>{(result.page-1)*pageSize+1}-{Math.min(result.page*pageSize,result.total)} of {result.total}</span>
            <label className="inline-flex items-center gap-2 text-xs">Rows per page
              <Select value={pageSize} aria-label="Rows per page"
                onChange={event=>{setPageSize(Number(event.target.value));setPage(1);}}
                className="min-h-11 md:min-h-9">
                {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
              </Select>
            </label>
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-[var(--lms-space-2)] sm:w-auto sm:justify-end">
            <Button
              size="sm" variant="secondary"
              className="min-h-11 md:min-h-9"
              disabled={result.page === 1}
              onClick={() => setPage(result.page - 1)}
            >
              Previous
            </Button>
            <span aria-live="polite">Page {result.page} of {result.pages}</span>
            <Button
              size="sm" variant="secondary"
              className="min-h-11 md:min-h-9"
              disabled={result.page >= result.pages}
              onClick={() => setPage(result.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
