import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP } from "@/modules/placements/college-drive-applications-model";
import { getCollegeApplicationPipeline } from "@/modules/placements/college-application-stage-service";
import { CollegeApplicationPipelineControls } from "@/components/placements/college-application-pipeline-controls";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function CollegeDriveApplicationsPage({ params, searchParams }: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const {jobId} = await params;
  const query = driveApplicationsParams(await searchParams);
  if (!query) return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications" />
    <ErrorState title="Invalid applicant filters" description="The requested search, status, screening or page is invalid."
      action={<Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/applications`} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>
  </div>;
  const [data,filters] = await Promise.all([
    getCollegeApplicationPipeline(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
  ]);
  const formatter = new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.name??"Unnamed learner"},
    {key:"email",header:"Email",cell:row=>row.email??"Not provided"},
    {key:"roll",header:"Roll",cell:row=>row.rollNumber??"Not recorded"},
    {key:"role",header:"Role",cell:row=>row.roleTitle},
    {key:"source",header:"Source",cell:row=>row.source},
    {key:"applied",header:"Applied (IST)",cell:row=>formatter.format(new Date(row.submittedAt))},
    {key:"application",header:"Application",cell:row=><StatusBadge tone={row.status==="SUBMITTED"?"info":"neutral"}>{row.status}</StatusBadge>},
    {key:"screening",header:"Screening",cell:row=>row.screening??"Not recorded"},
  ];
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title={"Applications · " + data.drive.title}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline min-h-11 md:min-h-[var(--lms-control-height)] inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Drive overview</Link>} />
    <form method="get" role="search" aria-label="Application filters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,2fr)_auto]">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name, email, roll or role
        <Input type="search" name="q" defaultValue={query.q} maxLength={100} />
      </label>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
        {(query.q || query.status!=="ALL" || query.screening!=="ALL" || query.source!=="ALL" || query.departmentId || query.programId || query.cohortId) ?
          <Link href={driveApplicationsHref(jobId,{...query,q:"",status:"ALL",screening:"ALL",source:"ALL",departmentId:undefined,programId:undefined,cohortId:undefined,page:1})} className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link> : null}
      </div>
      <Disclosure title="Advanced filters" className="md:col-span-2"
        defaultOpen={Boolean(query.status!=="ALL" || query.screening!=="ALL" || query.source!=="ALL" || query.departmentId || query.programId || query.cohortId)}>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-3">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Application
        <Select name="status" defaultValue={query.status} >
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Screening
        <Select name="screening" defaultValue={query.screening} >
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Source
        <Select name="source" defaultValue={query.source} >
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
        <Select name="departmentId" defaultValue={query.departmentId??""} >
          <option value="">All departments</option>
          {query.departmentId&&!filters.departments.some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {filters.departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
        <Select name="programId" defaultValue={query.programId??""} >
          <option value="">All programs</option>
          {query.programId&&!filters.programs.some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {filters.programs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
        <Select name="cohortId" defaultValue={query.cohortId??""} >
          <option value="">All batches</option>
          {query.cohortId&&!filters.cohorts.some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {filters.cohorts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
        </div>
      </Disclosure>
    </form>
    <Tabs ariaLabel="Application pipeline stages" renderPanel={false} value={query.stage}
      items={(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const).map(stage=>({
        value:stage,
        label:stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase(),
        count:stage==="ALL"?Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):data.stageCounts[stage]??0,
        href:driveApplicationsHref(jobId,{...query,stage,page:1}),
      }))}/>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-[var(--lms-font-sm)] text-[var(--lms-body-text)]">
      <span>{data.total} matching applications</span>
      <a href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${driveApplicationsHref(jobId,query,true).split("/export")[1] ?? ""}`}
        className="inline-flex min-h-11 items-center text-[var(--lms-font-sm)] font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9 min-h-[var(--lms-control-height)] hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    </div>
    {!data.storageReady?<section className="space-y-3">
      <p role="status" className="border-b border-[var(--lms-canvas-border)] pb-5 text-[var(--lms-font-base)]">
        Application stage actions are awaiting migration registration. You can still review the scoped applicant register.
      </p>
      <DataTable caption="College drive applicant register" columns={columns}
        rows={data.items} getRowKey={row=>row.id}
        empty={<EmptyState title="No matching applications" description="No applications match these filters." action={<Link href={driveApplicationsHref(jobId,{...query,q:"",status:"ALL",screening:"ALL",source:"ALL",stage:"ALL",departmentId:undefined,programId:undefined,cohortId:undefined,page:1})} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>} />
     </section>:
     <CollegeApplicationPipelineControls key={jobId+":"+JSON.stringify(query)} jobId={jobId} rows={data.items} total={data.total} query={query}/>}
    <nav aria-label="Application pagination" className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[var(--lms-font-sm)] text-[var(--lms-body-text)] sm:flex-row sm:items-center">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&_a]:flex-1 max-[767px]:[&_a]:justify-center">
        {query.page>1?<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-semibold text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveApplicationsHref(jobId,{...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-semibold text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveApplicationsHref(jobId,{...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
    <p className="max-w-[75ch] text-xs leading-5 text-muted-foreground">
      CSV uses formula-neutralized cells, includes filtered rows up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")},
      and includes a truncation notice if more matching rows exist.
    </p>
  </div>;
}
