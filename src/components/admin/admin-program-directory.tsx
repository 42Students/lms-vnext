"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ProgramActions } from "@/components/academics/academics-actions";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  adminProgramsCsv,
  filterAdminPrograms,
  paginateAdminPrograms,
  type AdminProgramRow,
} from "@/modules/admin-ui/program-directory";

const columns: DataTableColumn<AdminProgramRow>[] = [
  {
    key: "name", header: "Program",
    cell: (item) => (
      <div>
        <p className="m-0 font-semibold text-foreground">{item.name}</p>
        <p className="m-0 text-xs text-muted-foreground">{item.code}</p>
      </div>
    ),
  },
  { key: "department", header: "Department", cell: (item) => item.departmentName },
  { key: "duration", header: "Duration", cell: (item) => `${item.durationTerms} terms` },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (item) => <ProgramActions program={{
      id: item.id,
      name: item.name,
      code: item.code,
      durationTerms: item.durationTerms,
    }} />,
  },
];

export function AdminProgramDirectory({
  programs,
  departments,
}: {
  programs: readonly AdminProgramRow[];
  departments: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [durationTerms, setDurationTerms] = useState("8");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = filterAdminPrograms(programs, search);
  const result = paginateAdminPrograms(filtered, page);
  const csvHref = "data:text/csv;charset=utf-8," +
    encodeURIComponent("\ufeff" + adminProgramsCsv(filtered));

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const terms = Number(durationTerms);
    if (!departmentId || !name.trim() || !code.trim() ||
        !Number.isInteger(terms) || terms < 1 || terms > 24) {
      showToast({
        tone: "error", title: "Check program details",
        description: "Choose a department, name, code, and 1–24 academic terms.",
      });
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch("/api/academics/programs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            departmentId, name: name.trim(), code: code.trim(),
            durationTerms: terms,
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Unable to create program");
        }
        setName("");
        setCode("");
        showToast({ tone: "success", title: "Program created" });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error", title: "Program creation failed",
          description: error instanceof Error ? error.message : "Try again.",
        });
      }
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={create} className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Create program</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Programs belong to a department. The current vNext database stores duration in academic terms.
        </p>
        {departments.length === 0 ? (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            Create a department before adding programs.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="admin-program-department" className="mb-1 block text-xs font-semibold text-body">Department</label>
            <Select
              id="admin-program-department" value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="admin-program-name" className="mb-1 block text-xs font-semibold text-body">Program name</label>
            <Input id="admin-program-name" value={name} maxLength={255} required
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Computer Science Engineering" />
          </div>
          <div>
            <label htmlFor="admin-program-code" className="mb-1 block text-xs font-semibold text-body">Program code</label>
            <Input id="admin-program-code" value={code} maxLength={64} required
              onChange={(event) => setCode(event.target.value)} placeholder="CSE" />
          </div>
          <div>
            <label htmlFor="admin-program-duration" className="mb-1 block text-xs font-semibold text-body">Duration (terms)</label>
            <Input id="admin-program-duration" type="number" value={durationTerms}
              onChange={(event) => setDurationTerms(event.target.value)}
              min={1} max={24} required />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={pending || departments.length === 0}>
            {pending ? "Creating…" : "Create program"}
          </Button>
        </div>
      </form>
      <section className="space-y-3" aria-label="Existing programs">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="admin-program-search" className="mb-1 block text-xs font-semibold text-body">Search programs or departments</label>
            <Input id="admin-program-search" value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search program, code or department" />
          </div>
          <div className="flex gap-2">
            {filtered.length ? (
              <a
                href={csvHref} download="programs.csv"
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary"
              >Export CSV</a>
            ) : <Button variant="secondary" disabled>Export CSV</Button>}
            <Button variant="secondary" onClick={() => router.refresh()}>Refresh</Button>
          </div>
        </div>
        <DataTable columns={columns} rows={result.items}
          getRowKey={(item) => item.id}
          empty={<p className="m-0 text-sm text-muted-foreground">
            {search ? "No matching programs." : "No programs yet. Create a department first."}
          </p>} />
        {result.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Showing {(result.page - 1) * 10 + 1}–{Math.min(result.page * 10, result.total)} of {result.total}</span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" disabled={result.page === 1}
                onClick={() => setPage(result.page - 1)}>Previous</Button>
              <span aria-live="polite">Page {result.page} of {result.pages}</span>
              <Button size="sm" variant="secondary" disabled={result.page === result.pages}
                onClick={() => setPage(result.page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
