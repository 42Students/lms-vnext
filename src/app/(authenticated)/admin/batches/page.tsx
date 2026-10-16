import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AdminScopedReadPage } from "@/components/admin/admin-scoped-read-page";
import { CollegeCohortCreateForm, CollegeCohortRowActions } from "@/components/academics/college-cohort-management";
import { listAdminBatches } from "@/modules/admin-ui/super-admin-batches-service";
import { listCollegeBatches } from "@/modules/academics/college-academic-directory-service";
import { listAcademicPeriods } from "@/modules/academics/period-service";
import { collegeBatchDirectorySchema } from "@/modules/academics/college-academic-directory-model";

const statuses = ["ALL", "PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminBatchesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const controls = collegeBatchDirectorySchema.safeParse({
    q: raw.q, programId: raw.programId || undefined, status: raw.status, page: raw.page,
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
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
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
              <th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
            <tbody>{data.items.map(row => <tr key={row.id} className="border-t border-border">
              <td className="p-2">{row.name} ({row.code})</td>
              <td className="p-2">{row.programName}</td>
              <td className="p-2">{row.status}</td>
              <td className="p-2"><CollegeCohortRowActions row={row} periods={periods} /></td>
            </tr>)}</tbody>
          </table></div>}
        <Link href="/admin/batch-promotion" className="inline-flex min-h-10 items-center font-semibold text-primary-text">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
    <AdminScopedReadPage title="Batches" path="/admin/batches" statuses={statuses}
      exportPath="/api/admin/batches/export" exportFilename="super-admin-batches-ist.csv"
      description="Manage college-owned batches in the selected safety scope. Promotion and student moves are separate workflows."
      searchParams={Promise.resolve(raw)} loader={query => listAdminBatches(context, query)} />
  </div>;
}
