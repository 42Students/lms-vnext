"use client";

import { useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {apiFetch} from "@/lib/api-fetch";
import {deriveSuperAdminProgramCode,validLegacyProgramYears} from "@/modules/admin-ui/super-admin-program-input";
import { ProgramActions } from "@/components/academics/academics-actions";
import { createCollegeProgramSchema } from "@/modules/academics/college-program-mutation-model";
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
  programDurationYearsLabel, legacyDurationYearsToTerms,
} from "@/modules/admin-ui/program-directory";

const PROGRAM_SIZE_KEY = "42lms-program-page-size";
function listenSize(fn: () => void) {
  window.addEventListener("storage", fn);
  window.addEventListener("lms-program-size", fn);
  return () => { window.removeEventListener("storage", fn); window.removeEventListener("lms-program-size", fn); };
}
function storedSize(): number {
  try {
    const size = Number(localStorage.getItem(PROGRAM_SIZE_KEY));
    return [10,25,50,100].includes(size) ? size : 10;
  } catch { return 10; }
}
function rememberSize(size: number) {
  try { localStorage.setItem(PROGRAM_SIZE_KEY, String(size)); } catch { return; }
  window.dispatchEvent(new Event("lms-program-size"));
}

const columns = (departments: readonly {id:string;name:string}[]): DataTableColumn<AdminProgramRow>[] => [
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
  { key: "duration", header: "Duration", cell: (item) => programDurationYearsLabel(item.durationTerms) },
  {
    key: "contents",
    header: "Contents",
    cell: (item) => item.contents
      ? <span title="Archived records are also counted because they may block deletion">
          {item.contents.semesters} semesters · {item.contents.batches} batches · {item.contents.classes} classes
        </span>
      : <span className="text-muted-foreground">—</span>,
  },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    cell: (item) => <ProgramActions displayDurationYears program={{
      id: item.id,
      name: item.name,
      code: item.code,
      durationTerms: item.durationTerms,
      departmentId: item.departmentId,
    }} departments={departments} contents={item.contents ?? null} />,
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
  const [durationYears, setDurationYears] = useState("4");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = useSyncExternalStore(listenSize, storedSize, () => 10);

  const filtered = filterAdminPrograms(programs, search);
  const result = paginateAdminPrograms(filtered, page, pageSize);
  const csvHref = "data:text/csv;charset=utf-8," +
    encodeURIComponent("\ufeff" + adminProgramsCsv(filtered));

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validLegacyProgramYears(durationYears)) {
      showToast({tone:"error",title:"Check program details",description:"Duration must be a whole number from 1 to 10 years."});return;
    }
    const parsed = createCollegeProgramSchema.safeParse({
      departmentId, name, code:code.trim() || deriveSuperAdminProgramCode(name), durationTerms: legacyDurationYearsToTerms(Number(durationYears)),
    });
    if (!parsed.success) {
      showToast({
        tone: "error", title: "Check program details",
        description: parsed.error.issues[0]?.message ?? "Enter a valid department, program, code and duration.",
      });
      return;
    }
    startTransition(async () => {
      try {
        await apiFetch("/api/academics/programs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        setName("");
        setCode("");
        showToast({ tone: "success", title: `Created program “${name.trim()}”. Next, create its semesters and batches.` });
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
        <h2 className="text-base font-semibold text-foreground">Create New Program</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Programs belong to a department. Choose the usual academic years; two terms are stored per year.
        </p>
        {departments.length === 0 ? (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            No departments in this college yet. <Link href="/college/departments" className="font-semibold text-primary-text underline">Go to Departments</Link>
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
            <label htmlFor="admin-program-name" className="mb-1 block text-xs font-semibold text-body">Program Name</label>
            <Input id="admin-program-name" value={name} maxLength={255} required
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Computer Science Engineering" />
          </div>
          <div>
            <label htmlFor="admin-program-code" className="mb-1 block text-xs font-semibold text-body">Program code (optional)</label>
            <Input id="admin-program-code" value={code} maxLength={64}
              onChange={(event) => setCode(event.target.value)} placeholder="CSE" />
          </div>
          <div>
            <label htmlFor="admin-program-duration" className="mb-1 block text-xs font-semibold text-body">Duration (Years)</label>
            <Input id="admin-program-duration" type="number" value={durationYears}
              onChange={(event) => setDurationYears(event.target.value)}
              min={1} max={10} step={1} required />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={pending || departments.length === 0}>
            {pending ? "Creating…" : "Create Program"}
          </Button>
        </div>
      </form>
      <section className="space-y-3" aria-label="Existing Programs"><h2 className="text-base font-semibold">Existing Programs</h2>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="admin-program-search" className="mb-1 block text-xs font-semibold text-body">Search programs or departments</label>
            <Input id="admin-program-search" value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search program, code or department" />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label htmlFor="admin-program-page-size" className="grid gap-1 text-xs font-semibold text-body">
              Rows per page
              <select id="admin-program-page-size" value={pageSize}
                onChange={(event) => { rememberSize(Number(event.target.value)); setPage(1); }}
                className="min-h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground">
                {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            {filtered.length ? (
              <a
                href={csvHref} download="programs.csv"
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-primary"
              >Export CSV</a>
            ) : <Button variant="secondary" disabled>Export CSV</Button>}
            <Button variant="secondary" onClick={() => router.refresh()}>Refresh</Button>
          </div>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {result.total} of {programs.length} {programs.length === 1 ? "result" : "results"}
        </p>
        <DataTable columns={columns(departments)} rows={result.items}
          getRowKey={(item) => item.id}
          empty={<p className="m-0 text-sm text-muted-foreground">
            {search
              ? "No matching programs."
              : departments.length === 0
                ? "No programs yet. Create a department first."
                : "No programs yet. Create the first program using the form above."}
          </p>} />
        {result.total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Showing {(result.page - 1) * pageSize + 1}–{Math.min(result.page * pageSize, result.total)} of {result.total}</span>
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
