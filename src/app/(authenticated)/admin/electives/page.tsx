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
import { Disclosure } from "@/components/ui/disclosure";
import { adminElectiveQuerySchema } from "@/modules/electives/admin-directory-model";
import { listSuperAdminElectives } from "@/modules/electives/admin-directory-service";

export default async function SuperAdminElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = adminElectiveQuerySchema.safeParse({ q: params.q, status: params.status,
    programId: params.programId || undefined, semesterNumber: params.semesterNumber || undefined });
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Electives" />
    <ErrorState title="Invalid elective filters" description="Search and status must use supported values."
      action={<Link href="/admin/electives" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  const [data, optionResult] = await Promise.all([
    listSuperAdminElectives(context, parsed.data),
    context.adminScope?.collegeId
      ? listCollegeElectiveSlotOptions(context).then(options => ({ options, error: false as const }))
        .catch(() => ({ options: null, error: true as const }))
      : Promise.resolve({ options: null, error: false as const }),
  ]);
  const options = optionResult.options;
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Electives"
      description="Manage elective slots and their offerings for this college." />
    {data.state === "CHOOSE_COLLEGE" ? <EmptyState title="Select a college to continue"
      description="Choose a college in the header above to see its electives." /> :
    <>
      {optionResult.error ? <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-sm">
        Unavailable: programs, courses, faculty, classes or batches could not be verified.
        <Link href="/admin/electives" className="ml-2 font-semibold underline">Retry options</Link>
      </p> : null}
      {options ? <CollegeSlotManager options={options} /> : null}
      <form aria-label="Filter elective slots" className="grid min-w-0 gap-[8px] border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
          <Input name="q" defaultValue={data.query.q} placeholder="Slot or program"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 md:min-h-9">
            <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
          </Select>
        </label>
        <Disclosure title="More filters" className="min-w-0 sm:col-span-2 xl:col-span-1" contentClassName="grid min-w-0 gap-3 pb-3 pt-2 sm:grid-cols-2 xl:grid-cols-1">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Select name="programId" defaultValue={data.query.programId ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All programs</option>
            {data.programs.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester
          <Select name="semesterNumber" defaultValue={data.query.semesterNumber ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All semesters</option>
            {Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
        </Disclosure>
        <Button type="submit" className="min-h-11 w-full justify-center self-end sm:w-auto md:min-h-9">Filter</Button>
      </form>
      <form method="get" action="/admin/electives" aria-label="Refresh elective directory">
        {data.query.q ? <Input type="hidden" name="q" value={data.query.q} /> : null}
        <Input type="hidden" name="status" value={data.query.status} />
        {data.query.programId?<Input type="hidden" name="programId" value={data.query.programId}/>:null}
        {data.query.semesterNumber?<Input type="hidden" name="semesterNumber" value={data.query.semesterNumber}/>:null}
        <Button variant="secondary" type="submit" className="inline-flex min-h-11 md:min-h-9 items-center px-4">Refresh</Button>
      </form>
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">In this page: {data.total} slots · {data.active} active · {data.archived} archived</p>
      {data.items.length ? <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)]">
        {data.items.map(row => { const item = row as typeof row & { description?: string | null; version: number }; return <article key={item.id} className="min-w-0 py-5 first:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="m-0 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">{item.name}</h2>
            <StatusBadge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{legacyAcademicStatus(item.status)}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-body">{item.programName} · Semester {item.semesterNumber}</p>
          <Disclosure title="Slot details" className="mt-3" contentClassName="pt-2 pb-2"><dl className="grid grid-cols-2 gap-3 text-sm text-body sm:grid-cols-3">
            <div><dt className="text-xs text-muted-foreground">Academic year</dt><dd>{item.academicYear ?? "Not linked"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Credits</dt><dd>{item.credits}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Minimum picks</dt><dd>{item.minPick}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Maximum picks</dt><dd>{item.maxPick}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Offerings</dt><dd>{item.offerings ?? 0}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Students</dt><dd>{item.students ?? 0}</dd></div>
          </dl></Disclosure>
          {options ? <div className="mt-3 flex flex-wrap gap-2">
            <Disclosure title="Slot management" className="min-w-0" contentClassName="space-y-2 pb-2 pt-2">
            <CollegeSlotManager options={options} row={{
              id:item.id, name:item.name, description:item.description ?? null,
              version:item.version, credits:item.credits, minPick:item.minPick,
              maxPick:item.maxPick, status:item.status,
              programId:item.programId, academicPeriodId:item.academicPeriodId,
              semesterNumber:item.semesterNumber, academicYear:item.academicYear,
              hasEnrollmentHistory:item.hasEnrollmentHistory,
            }} />
            <CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
              status={item.status} version={item.version} />
            </Disclosure>
            {item.status === "ACTIVE" ? <CollegeElectiveOfferingManager slotId={item.id} /> : null}
          </div> : null}
        </article>; })}
      </div> : <EmptyState title="No elective slots" description="No persisted elective slots match the current college and filters." />}
      {data.truncated ? <p className="text-sm text-muted-foreground">Showing only 200 matching elective slots. Narrow the search for older entries.</p> : null}
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Academic overview</Link>
  </div>;
}
