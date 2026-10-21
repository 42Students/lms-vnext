import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import {Disclosure} from "@/components/ui/disclosure";
import {EmptyState} from "@/components/ui/empty-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeClassCreate, CollegeClassRowActions } from "@/components/academics/college-section-management";
import { CollegeRecurringEntry } from "@/components/academics/college-recurring-entry";
import { listRecurringPreviewOptions } from "@/modules/academics/college-recurring-preview-service";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";
import { collegeClassQuerySchema, collegeStructureHref, type CollegeClassQuery } from "@/modules/academics/college-structure-directory-model";

const statuses = ["ALL", "ACTIVE", "ARCHIVED"] as const;
const pageUrl = (query: CollegeClassQuery) => collegeStructureHref("CLASSES", query).replace("/college/classes", "/admin/classes");
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminClassesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const filter = collegeClassQuerySchema.safeParse({
    q: raw.q, programId: raw.programId || undefined, cohortCode: raw.cohortCode || undefined, status: raw.status, page: raw.page, pageSize: raw.pageSize,
  });
  const [data, optionResult, recurringOptions] = selected && filter.success
    ? await Promise.all([
        listCollegeClasses(context, filter.data),
        listCollegeSectionOptions(context).then(options => ({options, error: false as const}))
          .catch(() => ({options: {cohorts: [], periods: []}, error: true as const})),
        listRecurringPreviewOptions(context).catch(() => null),
      ])
    : [null, null, null];
  const options = optionResult?.options;
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Classes"/>
      {data ? <AcademicSetupSteps step={6} /> : null}
    {!selected ? <p role="status" className="text-sm text-body">Select a college to continue. Choose a college in the header above to see its classes.</p> : null}
    {data ? <>
      {optionResult?.error ? <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-sm">
        Could not load class programs or batches. <Link href="/admin/classes" className="font-semibold underline">Retry options</Link>
      </p> : null}
      {options && !optionResult?.error ? <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} academicSetupHref="/admin/academics" /> : null}
      {recurringOptions ? <CollegeRecurringEntry options={{...recurringOptions,
        classes: recurringOptions.classes.map(row => ({...row, updatedAt: row.updatedAt.toISOString()}))}} /> : null}
      <section aria-label="Filter managed classes" className="border-b border-border pb-4">
        <form method="get" action="/admin/classes" role="search" aria-label="Class filters" className="grid min-w-0 items-end gap-[8px] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <label className="grid min-w-0 w-full gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 md:min-h-9">
              <option value="">All programs</option>
              {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 w-full gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code
            <Input type="search" name="cohortCode" defaultValue={data.query.cohortCode ?? ""} placeholder="Search batch code"
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-0 w-full gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search class, program or batch
            <Input name="q" type="search" defaultValue={data.query.q}
              className="min-h-11 md:min-h-9" />
          </label>
          <Disclosure title="More filters" defaultOpen={Boolean(data.query.status!=="ALL" || data.query.pageSize!==25 || data.query.cohortCode)}
            className="order-last min-w-0 md:col-span-2 xl:col-span-4"
            contentClassName="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-3)] md:grid-cols-2">
          <label className="grid min-w-0 w-full md:min-w-32 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
            <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
              {statuses.map(status=><option key={status} value={status}>{status==="ALL"?"All statuses":status}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 w-full md:min-w-32 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
            <Select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 md:min-h-9">
              {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </Select>
          </label>
          </Disclosure>
          <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          <Button variant="secondary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Refresh</Button>
          <Link href="/admin/classes" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Clear filters</Link>
        </form>
      </section>
      <section aria-label="Manage classes" className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Manage classes</h2>
        <p className="text-sm text-muted-foreground">Edit class names, codes and capacities within the selected college.</p>
        <DataTable<(typeof data.items)[number]> caption="Manage classes" rows={data.items} getRowKey={row=>row.id}
          empty={<EmptyState title="No matching classes on this page." />}
          columns={[
            {key:"class",header:"Class",mobilePriority:"primary",cell:row=><div className="min-w-0">
              <span className="font-semibold">{row.name} ({row.code})</span>
              <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Manage students →</Link>
              <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}#section-schedule`} className="ml-[var(--lms-space-3)] mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Schedule →</Link>
            </div>},
            {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName ?? `Name unavailable (ID ${row.linkedProgramId ?? "unknown"})` },
            {key:"batch",header:"Batch",mobilePriority:"secondary",cell:row=>row.cohortName ?? `Name unavailable (ID ${row.cohortId})` },
            {key:"description",header:"Description",mobilePriority:"secondary",cell:row=>row.description?.trim()||"—"},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:row=><>
              {row.activeLearners === null ? "Unavailable" : row.activeLearners}{row.capacity!==null&&row.activeLearners!==null&&row.activeLearners>=row.capacity?
                <span className="ml-2 rounded-[var(--lms-radius-pill)] border border-border bg-surface px-2 text-xs font-semibold text-foreground" title="Class is full; learners cannot be moved into it.">Class full</span>:null}
            </>},
            {key:"capacity",header:"Max Students",mobilePriority:"secondary",cell:row=>row.capacity??"—"},
            {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><CollegeClassRowActions row={row} cohorts={options?.cohorts} periods={options?.periods}/> },
          ]} />
        <nav aria-label="Class pages" className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
          <span role="status" aria-live="polite">{data.items.length} of {data.total.toLocaleString("en-IN")} results · Page {data.query.page} of {data.totalPages}</span>
          <div className="flex flex-wrap gap-2">
            {data.query.page>1?<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white text-sm" href={pageUrl({...data.query,page:data.query.page-1})}>Previous</Link>:null}
            {data.query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white text-sm" href={pageUrl({...data.query,page:data.query.page+1})}>Next</Link>:null}
          </div>
        </nav>
        <Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
  </div>;
}
