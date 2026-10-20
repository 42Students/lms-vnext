import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import { legacyAcademicStatus } from "@/modules/academics/legacy-academic-status";
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
    .map(row => ({ id: row.id, name: row.name, code: row.code, startDate:row.startDate, endDate:row.endDate }));
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin · Academic Setup" title="Batches"/>
      {data ? <AcademicSetupSteps step={5} /> : null}
    {!selected ? <p role="status" className="text-sm text-body">Select a college to continue. Choose a college in the header above to see its batches.</p> : null}
    {data ? <>
      <CollegeCohortCreateForm programs={data.programs.filter(row => row.status === "ACTIVE")} periods={periods} />
      <section aria-label="Filter managed batches" className="border-b border-border pb-4">
        <form action="/admin/batches" method="get" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-0 w-full md:min-w-48 gap-1 text-[13px] font-semibold text-body">
            Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 md:min-h-9">
              <option value="">All programs</option>
              {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 w-full md:min-w-40 flex-1 gap-1 text-[13px] font-semibold text-body">
            Search batches
            <Input type="search" name="q" defaultValue={data.query.q}
              className="min-h-11 md:min-h-9"/>
          </label>
          <label className="grid min-w-0 w-full md:min-w-36 gap-1 text-[13px] font-semibold text-body">
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 md:min-h-9">
              {statuses.map(status => <option key={status} value={status}>{status === "INACTIVE" ? "Inactive (planned / archived)" : legacyAcademicStatus(status, true)}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 w-full md:min-w-32 gap-1 text-[13px] font-semibold text-body">Rows per page
            <Select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 md:min-h-9">
              {[10,25,50,100].map(n=><option value={n} key={n}>{n}</option>)}
            </Select>
          </label>
          <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
          <Button variant="secondary" type="submit" className="min-h-11 md:min-h-9">Refresh</Button>
          <Link href="/admin/batches" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear filters</Link>
        </form>
      </section>
      <nav aria-label="Batch lifecycle views" className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/batches?status=ACTIVE" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Active batches</Link>
        <Link href="/admin/batches?status=INACTIVE" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Show inactive</Link>
        <Link href="/admin/batches?status=COMPLETED" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Show completed</Link>
      </nav>
      <section aria-label="Manage batches" className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-foreground">Manage batches</h2>
        <p className="text-sm text-muted-foreground">Only planned batches without dependents can be edited or removed.</p>
        <DataTable<(typeof data.items)[number]> caption="Manage batches" rows={data.items} getRowKey={row=>row.id}
          empty={<p role="status">No matching batches on this page.</p>}
          columns={[
            {key:"batch",header:"Batch",mobilePriority:"primary",cell:row=><div className="min-w-0">
              <span className="font-semibold">{row.name} ({row.code})</span>
              <Link href={`/admin/batches/${encodeURIComponent(row.id)}/students`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Manage students →</Link>
            </div>},
            {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName},
            {key:"start",header:"Start Date",mobilePriority:"secondary",cell:row=>row.startDate??"—"},
            {key:"end",header:"End Date",mobilePriority:"secondary",cell:row=>row.endDate??"—"},
            {key:"academicYear",header:"Academic Year",mobilePriority:"secondary",cell:row=>row.academicYear??(row.currentAcademicYearStart?`${row.currentAcademicYearStart}–${row.currentAcademicYearStart+1}`:"Not recorded")},
            {key:"semester",header:"Semester",mobilePriority:"secondary",cell:row=>row.currentTermNumber??"—"},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:row=>row.activeEnrolledLearners},
            {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><>
              {legacyAcademicStatus(row.status,true)}
              {row.inactiveAt?<span className="block text-xs text-muted-foreground">Inactive since {new Date(row.inactiveAt).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</span>:null}
            </>},
            {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><CollegeCohortRowActions row={row} periods={periods}/>},
          ]} />
        <nav aria-label="Batch pages" className="flex items-center justify-between gap-3 text-sm">
          <span role="status" aria-live="polite">{data.items.length} of {data.total} results · Page {data.query.page} of {data.totalPages}</span>
          <div className="flex flex-wrap gap-2">
            {data.query.page>1?<Link className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle" href={pageUrl({...data.query,page:data.query.page-1})}>Previous</Link>:null}
            {data.query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle" href={pageUrl({...data.query,page:data.query.page+1})}>Next</Link>:null}
          </div>
        </nav>
        <Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-primary-text">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
  </div>;
}
