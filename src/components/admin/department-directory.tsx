"use client";

import { Select } from "@/components/ui/select";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {StatusBadge} from "@/components/ui/status-badge";
import { DepartmentActions } from "@/components/admin/department-actions";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  departmentRowsCsv,
  filterDepartmentRows,
  pageDepartmentRows,
  type DepartmentDirectoryRow,
} from "@/modules/admin-ui/department-directory";

function countText(value:number|null|undefined){return value==null?"—":String(value);}
function usageChip(label:string,value:number|null|undefined){
 return <span className="inline-flex min-h-7 items-center" title={value==null?
  "Dependency count unavailable; refresh before archiving.":value+" active "+label}>
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
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {usageChip(row.usage?.programs===1?"program":"programs",row.usage?.programs)}
        {usageChip(row.usage?.courses===1?"course":"courses",row.usage?.courses)}
        {usageChip("faculty",row.usage?.faculty)}
      </div>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    mobilePriority: "action",
    className: "w-[120px] text-right",
    cell: (row) => <DepartmentActions departmentId={row.id} name={row.name} usage={row.usage} />,
  },
];

export function DepartmentDirectory({
  rows,
}: {
  rows: readonly DepartmentDirectoryRow[];
}) {
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
      </div>
      <p role="status" aria-live="polite" className="text-sm leading-[22px] text-muted-foreground">
        Departments retrieved · {result.total} of {rows.length} {rows.length === 1 ? "result" : "results"}
      </p>
      <DataTable
        columns={columns.map(column => column.key === "name" ? {
          ...column,
          header: <><span className="hidden print:inline">Department Name</span><Button type="button" variant="ghost" aria-label="Sort Department Name"
            onClick={() => { setNameOrder(nameOrder === "ASC" ? "DESC" : "ASC"); setPage(1); }}
            className="inline-flex min-h-11 items-center gap-2 md:min-h-9 print:hidden">
            Department Name {nameOrder === "ASC" ? "↑" : "↓"}
          </Button></>,
        } : column)}
        rows={result.items}
        getRowKey={(row) => row.id}
        empty={
          <p className="m-0 text-sm text-muted-foreground leading-[22px]">
            {search.trim()
              ? "No departments match this search."
              : "No departments found. Create a college first, then add departments."}
          </p>
        }
      />
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
