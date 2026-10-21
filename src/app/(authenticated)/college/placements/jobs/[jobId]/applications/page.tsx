import { CollegeDriveApplicationsExport } from "@/components/college/college-drive-applications-export";
import Link from "next/link";
import { z } from "zod";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getPlacementJob } from "@/modules/placements/job-service";
import { Alert } from "@/components/ui/alert";
import { CollegeApplicationDependentFilters } from "@/components/placements/college-application-dependent-filters";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP } from "@/modules/placements/college-drive-applications-model";
import { getCollegeApplicationPipeline } from "@/modules/placements/college-application-stage-service";
import { CollegeApplicationPipelineControls } from "@/components/placements/college-application-pipeline-controls";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import {CollegeApplicationsDebouncedSearch} from "@/components/placements/college-applications-debounced-search";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function CollegeDriveApplicationsPage({ params, searchParams }: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications" />
    <ErrorState title="Admin not assigned to a college"
      description="Your account has no current college assignment. Contact your Super Admin to restore College Admin access." />
  </div>;
  const {jobId} = await params;
  if (!z.uuid().safeParse(jobId).success) return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications" />
    <ErrorState title="Invalid job ID"
      description="This placement drive link is invalid. Return to the college drive list and choose a valid drive."
      action={<Link href="/college/placements/jobs" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Back to drives</Link>} />
  </div>;
  const rawParams=await searchParams;
  const query = driveApplicationsParams(rawParams);
  const initialDetailId=typeof rawParams.applicationId==="string" &&
   z.uuid().safeParse(rawParams.applicationId).success?rawParams.applicationId:null;
  if (!query) return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications" />
    <ErrorState title="Invalid applicant filters" description="The requested search, status, screening or page is invalid."
      action={<Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/applications`} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>
  </div>;
  // Independent reads: a failed register does not discard an available job header,
  // and failed selector options must never hide a usable applicant list.
  const [pipelineResult,filterResult,jobResult] = await Promise.allSettled([
    getCollegeApplicationPipeline(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
    getPlacementJob(context,jobId),
  ] as const);
  for (const result of [pipelineResult,filterResult,jobResult]) {
    if (result.status==="rejected" && result.reason instanceof AuthorizationError) {
      throw result.reason;
    }
  }
  const job = jobResult.status==="fulfilled" ? jobResult.value : null;
  const filters = filterResult.status==="fulfilled" ? filterResult.value :
    {departments:[],programs:[],cohorts:[]};
  if (pipelineResult.status==="rejected") return <div className="min-w-0 space-y-5">
    <PageHeader title={"Applications"+(job ? " · "+job.title : "")}
      actions={<Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/overview`} className="text-link underline">Drive overview</Link>} />
    {job ? <Alert tone="info">Drive: {job.title} · {job.status}. The drive details remain available even though its applicant register could not be loaded.</Alert> : null}
    <ErrorState title="Applications could not be loaded"
      description="The applicant register could not be refreshed. No application data has been changed. Retry the same scoped view."
      action={<Link href={driveApplicationsHref(jobId,query)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Retry applications</Link>} />
  </div>;
  const data = pipelineResult.value;
  const assessmentUrl = job?.legacyPostingDetails?.assessmentUrl;
  const safeAssessmentUrl = assessmentUrl && (assessmentUrl.startsWith("https://") || assessmentUrl.startsWith("http://")) ? assessmentUrl : null;
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
    <PageHeader title={"Applications ("+data.total.toLocaleString("en-IN")+")"}
      description={data.drive.title+" · Review applications, move candidates through hiring stages and notify them about decisions."}
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline min-h-11 md:min-h-[var(--lms-control-height)] inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Drive overview</Link>} />
    <nav aria-label="Drive sections" className="min-w-0">
      <Tabs ariaLabel="Drive sections" renderPanel={false} value="applications"
        items={[
          {value:"overview",label:"Overview",href:"/college/placements/jobs/"+jobId+"/overview"},
          {value:"applications",label:"Applications",href:"/college/placements/jobs/"+jobId+"/applications"},
          {value:"schedule",label:"Schedule",href:"/college/placements/jobs/"+jobId+"/interviews"},
          {value:"settings",label:"Settings",href:"/college/placements/jobs/"+jobId+"/settings"},
        ]}/>
    </nav>
    <section aria-label="Drive and application summary" className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
      <div className="flex flex-wrap items-center gap-3 text-[var(--lms-font-sm)]">
        <strong className="font-semibold">{job?.title ?? data.drive.title}</strong>
        {job ? <StatusBadge tone={job.status==="PUBLISHED"?"success":"neutral"}>{job.status}</StatusBadge> : null}
        {job?.openings != null ? <span>{job.openings} advertised opening(s)</span> : null}
      </div>
      <div className="flex flex-wrap gap-2 text-[var(--lms-font-sm)]">
        <span className="font-semibold">Pipeline:</span>
        {Object.entries(data.stageCounts).map(([stage,count])=>
          <span key={stage} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-1 text-sm font-semibold">
            {stage}: {count.toLocaleString("en-IN")}
          </span>)}
      </div>
    </section>
    {safeAssessmentUrl ? <Alert tone="info" title="Assessment link">
      <a href={safeAssessmentUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-link underline underline-offset-4">Open the drive assessment</a>
    </Alert> : <Alert tone="info">No assessment URL is recorded for this drive.</Alert>}
    {filterResult.status==="rejected" ? <Alert tone="warning">
      Department, program and batch choices could not be refreshed. Existing filters and the applicant register are still available.
      {" "}<Link href={driveApplicationsHref(jobId,query)} className="font-semibold underline underline-offset-4">Retry filter choices</Link>
    </Alert> : null}
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-[var(--lms-font-sm)] text-[var(--lms-body-text)]">
      <span>{data.total.toLocaleString("en-IN")} matching applications</span>
      <CollegeDriveApplicationsExport href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${driveApplicationsHref(jobId,query,true).split("/export")[1] ?? ""}`}
        matching={data.total} cap={DRIVE_APPLICATION_EXPORT_CAP}/>
    </div>
    <Tabs ariaLabel="Application pipeline stages" renderPanel={false} value={query.stage}
      items={(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","REJECTED","OFFERED","HIRED","WITHDRAWN"] as const).map(stage=>({
        value:stage,
        label:stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase(),
        count:stage==="ALL"?Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):data.stageCounts[stage]??0,
        href:driveApplicationsHref(jobId,{...query,stage,page:1}),
      }))}/>
    <form method="get" role="search" aria-label="Application filters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,2fr)_auto]">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search by name or email
        <CollegeApplicationsDebouncedSearch initialValue={query.q} placeholder="Search by name or email"/>
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
      <CollegeApplicationDependentFilters key={[query.departmentId,query.programId,query.cohortId].join(":")}
        initial={{departmentId:query.departmentId,programId:query.programId,cohortId:query.cohortId}}
        departments={filters.departments} programs={filters.programs} cohorts={filters.cohorts} />
        </div>
      </Disclosure>
    </form>
    {!data.storageReady?<section className="space-y-3">
      <p role="status" className="border-b border-[var(--lms-canvas-border)] pb-5 text-[var(--lms-font-base)] leading-[1.6]">
        Application stage actions are awaiting migration registration. You can still review the scoped applicant register.
      </p>
      <DataTable caption="College drive applicant register" columns={columns}
        rows={data.items} getRowKey={row=>row.id}
        empty={<EmptyState title="No matching applications" description="No applications match these filters." action={<Link href={driveApplicationsHref(jobId,{...query,q:"",status:"ALL",screening:"ALL",source:"ALL",stage:"ALL",departmentId:undefined,programId:undefined,cohortId:undefined,page:1})} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>} />
     </section>:
     <CollegeApplicationPipelineControls key={jobId+":"+JSON.stringify(query)} jobId={jobId} rows={data.items} total={data.total} query={query} initialDetailId={initialDetailId}/>}
    <nav aria-label="Application pagination" className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] text-[var(--lms-font-sm)] text-[var(--lms-body-text)] sm:flex-row sm:items-center">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&_a]:flex-1 max-[767px]:[&_a]:justify-center">
        {query.page>1?<Link className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveApplicationsHref(jobId,{...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-link-text)] md:min-h-[var(--lms-control-height)] hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={driveApplicationsHref(jobId,{...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
    <p className="max-w-[75ch] text-xs leading-5 text-muted-foreground">
      CSV uses formula-neutralized cells, includes filtered rows up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")},
      and includes a truncation notice if more matching rows exist.
    </p>
  </div>;
}
