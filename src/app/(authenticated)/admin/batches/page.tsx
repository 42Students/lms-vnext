import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCohortCreateForm, CollegeCohortRowActions } from "@/components/academics/college-cohort-management";
import { listCollegeBatches } from "@/modules/academics/college-academic-directory-service";
import { listAcademicPeriods } from "@/modules/academics/period-service";
import { collegeBatchDirectorySchema, academicDirectoryHref } from "@/modules/academics/college-academic-directory-model";

const statuses = ["ALL", "ACTIVE", "INACTIVE", "COMPLETED", "PLANNED", "ARCHIVED"] as const;
const pageUrl = (query: Parameters<typeof academicDirectoryHref>[1]) => academicDirectoryHref("BATCHES", query).replace("/college/batches", "/admin/batches");
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminBatchesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const controls = collegeBatchDirectorySchema.safeParse({
    q: raw.q, programId: raw.programId || undefined, status: raw.status, page: raw.page, pageSize: raw.pageSize,
  });
  const data = selected && controls.success
    ? await listCollegeBatches(context, controls.data)
    : null;
  const periodRows = selected && data
    ? await listAcademicPeriods(context, selected)
    : [];
  const periods = periodRows.filter(row => row.status !== "CLOSED")
    .map(row => ({ id: row.id, name: row.name, code: row.code }));
  return <div className="space-y-6">
      <AcademicSetupSteps step={5} />
    {data ? <>
      <CollegeCohortCreateForm programs={data.programs.filter(row => row.status === "ACTIVE")} periods={periods} />
      <section aria-label="Filter managed batches" className="rounded-xl border border-border bg-surface p-4">
        <form action="/admin/batches" method="get" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">
            Program
            <select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
          </label>
          <label className="grid min-w-40 flex-1 gap-1 text-sm font-semibold text-body">
            Search batches
            <input type="search" name="q" defaultValue={data.query.q}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
          </label>
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            Status
            <select name="status" defaultValue={data.query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              {statuses.map(status => <option key={status} value={status}>{status === "INACTIVE" ? "Inactive (planned / archived)" : status}</option>)}
            </select>
          </label>
          <label className="grid min-w-32 gap-1 text-sm font-semibold text-body">Rows per page
            <select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              {[10,25,50,100].map(n=><option value={n} key={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
          <Link href="/admin/batches" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear filters</Link>
        </form>
      </section>
      <section aria-label="Manage batches" className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Manage batches</h2>
        <p className="text-sm text-muted-foreground">Only planned batches without dependents can be edited or removed.</p>
        {data.items.length === 0 ? <p>No matching batches on this page.</p> :
          <div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm">
            <thead><tr><th className="p-2">Batch</th><th className="p-2">Program</th>
              <th className="p-2">Start Date</th><th className="p-2">End Date</th><th className="p-2">Academic Year</th>
              <th className="p-2">Semester</th><th className="p-2">Students</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
            <tbody>{data.items.map(row => <tr key={row.id} className="border-t border-border">
              <td className="p-2">{row.name} ({row.code})
                <Link href={`/admin/batches/${encodeURIComponent(row.id)}/students`} className="mt-1 block text-xs font-semibold text-primary-text">Manage students →</Link></td>
              <td className="p-2">{row.programName}</td>
              <td className="p-2">{row.startDate ?? "—"}</td>
              <td className="p-2">{row.endDate ?? "—"}</td>
              <td className="p-2">{row.currentAcademicYearStart ? `${row.currentAcademicYearStart}–${row.currentAcademicYearStart+1}` : "Not recorded"}</td>
              <td className="p-2">{row.currentTermNumber ?? "—"}</td>
              <td className="p-2">{row.activeEnrolledLearners}</td>
              <td className="p-2">{row.status}</td>
              <td className="p-2"><CollegeCohortRowActions row={row} periods={periods} /></td>
            </tr>)}</tbody>
          </table></div>}
        <nav aria-label="Batch pages" className="flex items-center justify-between gap-3 text-sm">
          <span>{data.total} batches · Page {data.query.page} of {data.totalPages}</span>
          <div className="flex gap-3">
            {data.query.page>1?<Link href={pageUrl({...data.query,page:data.query.page-1})}>Previous</Link>:null}
            {data.query.page<data.totalPages?<Link href={pageUrl({...data.query,page:data.query.page+1})}>Next</Link>:null}
          </div>
        </nav>
        <Link href="/admin/batch-promotion" className="inline-flex min-h-10 items-center font-semibold text-primary-text">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
  </div>;
}
