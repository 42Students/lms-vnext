"use client";

import { Select } from "@/components/ui/select";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
import { useState } from "react";
import { Disclosure } from "@/components/ui/disclosure";
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

function countText(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : String(value);
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
      <span
        className="text-xs text-body"
        title={row.usage ? "Active linked records; archive requires all three counts to be zero." : "Usage counts unavailable; archive may be blocked."}
      >
        {countText(row.usage?.programs)} programs ·{" "}
        {countText(row.usage?.courses)} courses ·{" "}
        {countText(row.usage?.faculty)} faculty
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
  const [search, setSearch] = useState("");
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
      <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">{DEPARTMENT_COPY.existingTitle}</h2>
      <div className="grid min-w-0 items-end gap-[var(--lms-space-3)] print:hidden sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 flex-1">
          <label htmlFor="department-directory-search" className="mb-[6px] block text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search departments
          </label>
          <Input id="department-directory-search" placeholder="Search departments"
            value={search} className="min-h-11 w-full md:min-h-9"
            onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        </div>
        {search.trim() ? <Button size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
          onClick={() => { setSearch(""); setPage(1); }}>Clear search</Button> : null}
        <Disclosure title="View options" className="min-w-0 sm:self-end sm:col-start-2"
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
          <span>
            Showing {(result.page - 1) * pageSize + 1}–{Math.min(result.page * pageSize, result.total)} of {result.total}
          </span>
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
