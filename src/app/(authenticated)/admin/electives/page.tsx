import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { legacyAcademicStatus } from "@/modules/academics/legacy-academic-status";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { CollegeElectiveOfferingManager } from "@/components/electives/college-elective-offering-manager";
import { CollegeElectiveLifecycleAction } from "@/components/electives/college-elective-lifecycle-action";
import { listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminElectiveQuerySchema } from "@/modules/electives/admin-directory-model";
import { listSuperAdminElectives } from "@/modules/electives/admin-directory-service";

export default async function SuperAdminElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = adminElectiveQuerySchema.safeParse({ q: params.q, status: params.status,
    programId: params.programId || undefined, semesterNumber: params.semesterNumber || undefined });
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader  title="Electives" />
    <ErrorState title="Invalid elective filters" description="Search and status must use supported values."
      action={<Link href="/admin/electives" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  const [data, options] = await Promise.all([
    listSuperAdminElectives(context, parsed.data),
    context.adminScope?.collegeId ? listCollegeElectiveSlotOptions(context) : Promise.resolve(null),
  ]);
  return <div className="min-w-0 space-y-5">
    <PageHeader  title="Electives"
      description="Manage elective slots and their offerings for this college." />
    {data.state === "CHOOSE_COLLEGE" ? <EmptyState title="Select a college to continue"
      description="Choose a college in the header above to see its electives." /> :
    <>
      {options ? <CollegeSlotManager options={options} /> : null}
      <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1 text-sm font-semibold text-body">Search
          <Input name="q" defaultValue={data.query.q} placeholder="Slot or program"
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Program
          <Select name="programId" defaultValue={data.query.programId ?? ""}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="">All programs</option>
            {data.programs.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Semester
          <Select name="semesterNumber" defaultValue={data.query.semesterNumber ?? ""}
            className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="">All semesters</option>
            {Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 sm:min-h-9 self-end rounded-[var(--lms-control-radius)] bg-primary px-4 text-on-primary font-[650]">Filter</Button>
      </form>
      <form method="get" action="/admin/electives" aria-label="Refresh elective directory">
        {data.query.q ? <input type="hidden" name="q" value={data.query.q} /> : null}
        <input type="hidden" name="status" value={data.query.status} />
        {data.query.programId?<input type="hidden" name="programId" value={data.query.programId}/>:null}
        {data.query.semesterNumber?<input type="hidden" name="semesterNumber" value={data.query.semesterNumber}/>:null}
        <Button variant="secondary" type="submit" className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Refresh</Button>
      </form>
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">In this page: {data.total} slots · {data.active} active · {data.archived} archived</p>
      {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
        {data.items.map(row => { const item = row as typeof row & { description?: string | null; version: number }; return <article key={item.id} className="min-w-0 border-b border-border py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="m-0 break-words text-base font-semibold text-foreground">{item.name}</h2>
            <StatusBadge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{legacyAcademicStatus(item.status)}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-body">{item.programName} · Semester {item.semesterNumber}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-body">
            <div><dt className="text-xs text-muted-foreground">Academic year</dt><dd>{item.academicYear ?? "Not linked"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Credits</dt><dd>{item.credits}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Minimum picks</dt><dd>{item.minPick}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Maximum picks</dt><dd>{item.maxPick}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Offerings</dt><dd>{item.offerings ?? 0}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Students</dt><dd>{item.students ?? 0}</dd></div>
          </dl>
          {options ? <div className="mt-3 flex flex-wrap gap-2">
            <CollegeSlotManager options={options} row={{
              id:item.id, name:item.name, description:item.description ?? null,
              version:item.version, credits:item.credits, minPick:item.minPick,
              maxPick:item.maxPick, status:item.status,
            }} />
            {item.status === "ACTIVE" ? <CollegeElectiveOfferingManager slotId={item.id} /> : null}
            <CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
              status={item.status} version={item.version} />
          </div> : null}
        </article>; })}
      </div> : <EmptyState title="No elective slots" description="No persisted elective slots match the current college and filters." />}
      {data.truncated ? <p className="text-sm text-muted-foreground">Showing only 200 matching elective slots. Narrow the search for older entries.</p> : null}
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline sm:min-h-9">← Academic overview</Link>
  </div>;
}
