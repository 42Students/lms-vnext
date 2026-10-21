import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import {Disclosure} from "@/components/ui/disclosure";
import {EmptyState} from "@/components/ui/empty-state";
import {Alert} from "@/components/ui/alert";
import {CollegeSectionLifecycleAction} from "@/components/academics/college-section-lifecycle-action";
import {SuperAdminClassBatchFilter} from "@/components/academics/super-admin-class-batch-filter";
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
    q: raw.q, programId: raw.programId || undefined, cohortCode: raw.cohortCode || undefined, status: raw.status??"ACTIVE", page: raw.page, pageSize: raw.pageSize??"20",
  });
  const loaded=selected && filter.success
    ? await Promise.allSettled([
        listCollegeClasses(context,filter.data),
        listCollegeSectionOptions(context),
      ]) :null;
  const data=loaded?.[0]?.status==="fulfilled"?loaded[0].value:null;
  const options=loaded?.[1]?.status==="fulfilled"?loaded[1].value:null;
  const exportHref=data?"/api/admin/classes/export?"+new URLSearchParams({
    ...(data.query.q?{q:data.query.q}:{}),
    ...(data.query.programId?{programId:data.query.programId}:{}),
    ...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{}),
    status:data.query.status,
  }).toString():null;
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Classes & Sections"
      description="Create classes for the selected program and batch, manage students, and schedule teaching sessions."/>
    {selected?<AcademicSetupSteps step={6}/>:null}
    {!selected?<Alert tone="warning">
      <strong>Select a college to continue.</strong> Choose a college in the header above to see its classes.
    </Alert>:null}
    {selected&&!filter.success?<Alert tone="error">Invalid class filters. <Link href="/admin/classes">Clear filters</Link></Alert>:null}
    {selected&&loaded?.[0]?.status==="rejected"?<Alert tone="error">Could not load classes.
      <Link href="/admin/classes" className="ml-2 font-semibold underline">Retry classes</Link>
    </Alert>:null}
    {selected&&loaded?.[1]?.status==="rejected"?<Alert tone="warning">Could not load class options.
      <Link href="/admin/classes" className="ml-2 font-semibold underline">Retry options</Link>
    </Alert>:null}
    {data ? <>
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
    <section aria-label="Create New Class/Section" className="min-w-0">
      {options?<CollegeClassCreate cohorts={options.cohorts} periods={options.periods} alwaysOpen academicSetupHref="/admin/academics"/>:
       <Alert tone="warning">Class creation is unavailable until the college's batch/period options load.</Alert>}
    </section>
    <div className="min-w-0 space-y-4">
      <section aria-label="Filter managed classes" className="border-b border-border pb-4">
        <form method="get" action="/admin/classes" role="search" aria-label="Class filters" className="grid min-w-0 items-end gap-[8px] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <SuperAdminClassBatchFilter
            programs={data.programs} cohorts={options?.cohorts??[]}
            selectedProgramId={data.query.programId??""}
            selectedCohortCode={data.query.cohortCode??""}/>
          <label className="grid min-w-0 w-full gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search class, program, batch or capacity
            <Input name="q" type="search" placeholder="Search class, program, batch or capacity" defaultValue={data.query.q}
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
              {[10,20,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </Select>
          </label>
          </Disclosure>
          <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          <Button variant="secondary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Refresh</Button>
          <Link href="/admin/classes" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Clear filters</Link>
        </form>
      </section>
      <section aria-label="Manage classes" className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
        <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Existing Classes/Sections</h2>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href={pageUrl(data.query)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh</Link>
          {exportHref?<Link href={exportHref} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Export classes.csv</Link>:null}
          <span className="text-xs tabular-nums text-muted-foreground">{data.total.toLocaleString("en-IN")} results</span>
        </div>
        <p className="text-sm text-muted-foreground">Edit class names, codes and capacities within the selected college.</p>
        <DataTable<(typeof data.items)[number]> caption="Manage classes" rows={data.items} getRowKey={row=>row.id}
          empty={<EmptyState title={data.total===0 && !data.query.q && !data.query.programId && !data.query.cohortCode?"No classes yet. Create your first class or section.":"No matching classes."} />}
          columns={[
            {key:"class",header:"Class Name",mobilePriority:"primary",cell:row=><div className="min-w-0">
              <span className="font-semibold">{row.name} ({row.code})</span>
              <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Manage students →</Link>
              <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}#section-schedule`} className="ml-[var(--lms-space-3)] mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Schedule →</Link>
            </div>},
            {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName},
            {key:"batch",header:"Batch",mobilePriority:"secondary",cell:row=>row.cohortName},
            {key:"capacity",header:"Max Students",mobilePriority:"secondary",cell:row=>row.capacity===null||row.capacity===0?"No limit":row.capacity},
            {key:"description",header:"Description",mobilePriority:"secondary",cell:row=><span className="block max-w-[180px] truncate" title={row.description??undefined}>{row.description?.trim()||"—"}</span>},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:row=><>
              {Number.isFinite(row.activeLearners)?row.activeLearners:"Unavailable"}{row.capacity!==null&&row.capacity>0&&row.activeLearners>=row.capacity?
                <span className="ml-2 rounded-[var(--lms-radius-pill)] border border-border bg-surface px-2 text-xs font-semibold text-foreground" title="Class is full; learners cannot be moved into it.">Class full</span>:null}
            </>},
            {key:"actions",header:"Actions",mobilePriority:"action",cell:row=>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CollegeClassRowActions row={row}/>
                <CollegeSectionLifecycleAction row={{id:row.id,name:row.name,status:row.status,
                  updatedAt:row.updatedAt.toISOString()}}/>
                <Link href={"/admin/academics/sections/"+encodeURIComponent(row.id)}
                  className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Open</Link>
                <Link href={"/admin/academics/sections/"+encodeURIComponent(row.id)+"#section-schedule"}
                  className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Schedule</Link>
              </div>},
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
    </div></div>
    </> : null}
  </div>;
}
