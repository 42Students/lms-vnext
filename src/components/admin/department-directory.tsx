"use client";

import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
    cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
  },
  {
    key: "usage",
    header: "Contents",
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
    className: "text-right",
    cell: (row) => <DepartmentActions departmentId={row.id} name={row.name} usage={row.usage} />,
  },
];

export function DepartmentDirectory({
  rows,
}: {
  rows: readonly DepartmentDirectoryRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nameOrder, setNameOrder] = useState<"ASC" | "DESC">("ASC");
  const [refreshing, startRefresh] = useTransition();
  const ordered = filterDepartmentRows(rows, search);
  const filtered = nameOrder === "DESC" ? [...ordered].reverse() : ordered;
  const result = pageDepartmentRows(filtered, page, pageSize);
  const exportHref = "data:text/csv;charset=utf-8," +
    encodeURIComponent("\ufeff" + departmentRowsCsv(filtered));

  return (
    <section className="space-y-4" aria-label={DEPARTMENT_COPY.existingTitle}>
      <h2 className="m-0 text-base font-semibold text-foreground">{DEPARTMENT_COPY.existingTitle}</h2>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="department-directory-search" className="mb-1.5 block text-xs font-semibold text-body">
            Search departments
          </label>
          <Input
            id="department-directory-search"
            placeholder="Search departments"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label htmlFor="department-directory-page-size" className="grid gap-1 text-xs font-semibold text-body">
            Rows per page
            <select id="department-directory-page-size" value={pageSize}
              onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
              className="min-h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground">
              {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          {search.trim() ? <Button size="sm" variant="secondary" onClick={() => { setSearch(""); setPage(1); }}>Clear search</Button> : null}
          {filtered.length ? (
            <a
              href={exportHref}
              download="departments.csv"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
            >
              Export CSV
            </a>
          ) : (
            <Button size="sm" variant="secondary" disabled>Export CSV</Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {result.total} of {rows.length} {rows.length === 1 ? "result" : "results"}
      </p>
      <DataTable
        columns={columns.map(column => column.key === "name" ? {
          ...column,
          header: <button type="button" aria-label="Sort Department Name"
            onClick={() => { setNameOrder(nameOrder === "ASC" ? "DESC" : "ASC"); setPage(1); }}
            className="inline-flex items-center gap-2 font-semibold">
            Department Name {nameOrder === "ASC" ? "↑" : "↓"}
          </button>,
        } : column)}
        rows={result.items}
        getRowKey={(row) => row.id}
        empty={
          <p className="m-0 text-sm text-muted-foreground">
            {search.trim()
              ? "No departments match this search."
              : "No departments found. Create a college first, then add departments."}
          </p>
        }
      />
      {rows.some((row) => row.usage === null) ? (
        <p className="text-xs text-muted-foreground" role="status">
          Some dependency counts are unavailable. They are shown as —, not zero.
          Refresh to retry; archiving remains checked by the server.
        </p>
      ) : null}
      {result.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Showing {(result.page - 1) * pageSize + 1}–{Math.min(result.page * pageSize, result.total)} of {result.total}
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm" variant="secondary"
              disabled={result.page === 1}
              onClick={() => setPage(result.page - 1)}
            >
              Previous
            </Button>
            <span aria-live="polite">Page {result.page} of {result.pages}</span>
            <Button
              size="sm" variant="secondary"
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
