import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { ErrorState } from "@/components/ui/error-state";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Banner } from "@/components/ui/banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { driveApplicationsHref, driveApplicationsParams, DRIVE_APPLICATION_EXPORT_CAP } from "@/modules/placements/college-drive-applications-model";
import { getCollegeApplicationPipeline } from "@/modules/placements/college-application-stage-service";
import { CollegeApplicationPipelineControls } from "@/components/placements/college-application-pipeline-controls";
import { listCollegeDriveApplicationFilters } from "@/modules/placements/college-drive-applications-options-service";

function adminHref(...args: Parameters<typeof driveApplicationsHref>) {
 return driveApplicationsHref(...args).replace("/college/placements/","/admin/placements/");
}
export default async function SuperAdminDriveApplicationsPage({ params, searchParams }: {
  params: Promise<{jobId:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Drives" description="Placement administration requires a college safety scope." />
    <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
  </div>;
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId} = await params;
  const rawQuery=await searchParams;
  const query = driveApplicationsParams(rawQuery);
  const resetHref="/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications";
  const retryHref=resetHref+"?"+new URLSearchParams(
   Object.entries(rawQuery).filter((entry):entry is [string,string]=>
    typeof entry[1]==="string"&&!Array.isArray(entry[1]))
  ).toString();
  // Do not pass a malformed ID through the scoped service and mistake an
  // input error for a missing or inaccessible college record.
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId))
   return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications"/>
    <ErrorState title="Invalid job ID" description="Choose a valid drive from your selected college."
     action={<Link href="/admin/placements/drives" className="font-semibold text-primary-text underline">Back to drives</Link>}/>
   </div>;
  if (!query) return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications" description="Review candidates in this drive and manage hiring stages."/>
    <ErrorState title="Invalid applicant filters"
      description="The requested search, status, screening or page is invalid."
      action={<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}/>
  </div>;
  const [pipelineResult,filterResult]=await Promise.allSettled([
    getCollegeApplicationPipeline(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
  ]);
  if(pipelineResult.status==="rejected"){
   // This is a server-rendered, scope-bound read: do not recycle data from a
   // different selected college or imply that it is still current.
   return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications"/>
    <ErrorState title="Failed to load data"
     description="Failed to load job and applications. Please try again. The selected college's application rows could not be verified."
     action={<div className="flex flex-wrap gap-3">
      <Link href={retryHref} className="font-semibold text-primary-text underline">Retry applications</Link>
      <Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)} className="font-semibold text-primary-text underline">Drive overview</Link>
     </div>}/>
   </div>;
  }
  const data=pipelineResult.value;
  const filters=filterResult.status==="fulfilled"?filterResult.value:null;
  return <div className="min-w-0 space-y-4 md:space-y-6">
    
    <PageHeader title={"Applications · " + data.drive.title}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Drive overview</Link>} />
    {filters===null?<Banner tone="warning" action={<Link href={retryHref} className="font-semibold underline">Retry filter choices</Link>}>
      Department, program and batch options could not be loaded. The current applications remain visible; academic filter choices are unavailable.
    </Banner>:null}
    <form method="get" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]" aria-label="Filter job applications">
      <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Name, email, roll or role
        <Input name="q" defaultValue={query.q} maxLength={100} className="min-h-11 w-full md:min-h-9" />
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Application
        <Select name="status" defaultValue={query.status} className="min-h-11 w-full md:min-h-9">
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
      </div>
      <details className="min-w-0" open={Boolean(query.screening!=="ALL"||query.source!=="ALL"||query.departmentId||query.programId||query.cohortId)}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Screening
        <Select name="screening" defaultValue={query.screening} className="min-h-11 w-full md:min-h-9">
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Source
        <Select name="source" defaultValue={query.source} className="min-h-11 w-full md:min-h-9">
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Department
        <Select name="departmentId" defaultValue={query.departmentId??""} className="min-h-11 w-full md:min-h-9">
          <option value="">All departments</option>
          {query.departmentId&&!(filters?.departments??[]).some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {(filters?.departments??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Program
        <Select name="programId" defaultValue={query.programId??""} className="min-h-11 w-full md:min-h-9">
          <option value="">All programs</option>
          {query.programId&&!(filters?.programs??[]).some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {(filters?.programs??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Batch
        <Select name="cohortId" defaultValue={query.cohortId??""} className="min-h-11 w-full md:min-h-9">
          <option value="">All batches</option>
          {query.cohortId&&!(filters?.cohorts??[]).some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {(filters?.cohorts??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </label>

        </div>
      </details>
      <Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Clear filters</Link>
    </form>
    <nav className="flex min-w-0 flex-wrap items-center gap-3 text-sm" aria-label="Application views">
      <Link href={resetHref} className="font-semibold text-primary-text underline">All applications</Link>
      <Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/shortlisted"}
       className="font-semibold text-primary-text underline">Manage Shortlisted · Assessment</Link>
    </nav>
    <Tabs ariaLabel="Application pipeline stages" value={query.stage} renderPanel={false}
      items={(["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const).map(stage=>({
       value:stage,label:stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase(),
       count:stage==="ALL"?Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):data.stageCounts[stage]??0,
       href:adminHref(jobId,{...query,stage,page:1}),
      }))}/>
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] text-sm sm:flex-row sm:items-center sm:justify-between">
      <span>{data.total.toLocaleString("en-IN")} matching applications</span>
      <a href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${adminHref(jobId,query,true).split("/export")[1] ?? ""}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Export CSV (up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")})</a>
    </div>
    {!data.storageReady?<section className="space-y-3">
      <Banner tone="warning">Application stage actions are awaiting migration registration. You can still review the scoped applicant register.</Banner>
      <DataTable<(typeof data.items)[number]> rows={data.items} getRowKey={row=>row.id}
       caption="Drive applications" columns={[
        {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.name??"Unnamed learner"},
        {key:"roll",header:"Roll",mobilePriority:"secondary",cell:row=>row.rollNumber??"Not recorded"},
        {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle},
        {key:"application",header:"Application",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="SUBMITTED"?"info":row.status==="REJECTED"?"error":row.status==="WITHDRAWN"?"neutral":"warning"}>{row.status}</StatusBadge>},
        {key:"screening",header:"Screening",mobilePriority:"secondary",cell:row=>row.screening??"Not recorded"},
       ]} empty={<EmptyState title="No matching applications" description="No applications match these filters."/>}/>
     </section>:
     <CollegeApplicationPipelineControls jobId={jobId} rows={data.items} total={data.total} query={query} basePath="/admin/placements"/>}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between">
      <p role="status" className="text-sm text-muted-foreground">Page {query.page} of {data.totalPages}</p>
      <Pagination page={query.page} pageCount={data.totalPages} label="Application pagination"
        hrefForPage={page=>adminHref(jobId,{...query,page})}/>
    </div>
    <p className="text-xs text-muted-foreground">
      CSV uses formula-neutralized cells, includes filtered rows up to {DRIVE_APPLICATION_EXPORT_CAP.toLocaleString("en-IN")},
      and includes a truncation notice if more matching rows exist.
    </p>
  </div>;
}
