import {CollegeDriveApplicationsSizeControl} from "@/components/placements/college-drive-applications-size-control";
import {LastKnownGoodApplications} from "@/components/placements/last-known-good-applications";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { getPlacementJobLegacyDetail } from "@/modules/placements/job-service";
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
import { SuperAdminDriveApplicationsCsvControl } from "@/components/admin/super-admin-drive-applications-csv-control";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";

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
    <Banner tone="warning" role="alert">
      <strong>Select a college to continue.</strong> Applications is college-scoped.
      Pick an Organization + College in the header above.{" "}
      <TextLink href="/admin/placements">Go to Superadmin</TextLink>
    </Banner>
  </div>;
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId} = await params;
  const rawQuery=await searchParams;
  const query = driveApplicationsParams(rawQuery);
  // A legacy return path is only used for navigation, never tenant scope or
  // database filtering. Do not allow absolute or protocol-relative targets.
  const requestedReturn=typeof rawQuery["returnTo"]==="string"?rawQuery["returnTo"]:"";
  const returnTo=requestedReturn.startsWith("/admin/placements")&&
    !requestedReturn.startsWith("//")&&!requestedReturn.includes("\\")&&
    requestedReturn.length<512?requestedReturn:"/admin/placements/drives";
  const shortlisted=rawQuery["shortlisted"]==="true";
  const preserved=returnTo==="/admin/placements/drives"?"":"?returnTo="+encodeURIComponent(returnTo);
  const validView=(rawQuery["shortlisted"]===undefined||rawQuery["shortlisted"]==="true")&&
    (rawQuery["returnTo"]===undefined||typeof rawQuery["returnTo"]==="string");
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
     action={<TextLink href="/admin/placements/drives">Back to drives</TextLink>}/>
   </div>;
  // The legacy initial Super Admin Applications view opens Assessment.
  // Explicit scoped searches/bookmarks remain unchanged.
  if (Object.keys(rawQuery).every(key => key === "returnTo") && validView) {
    redirect(resetHref + "?stage=ASSESSMENT" +
      (requestedReturn && returnTo !== "/admin/placements/drives"
        ? "&returnTo=" + encodeURIComponent(returnTo) : ""));
  }
  if (!query||!validView) return <div className="min-w-0 space-y-5">
    <PageHeader title="Applications" description="Review candidates in this drive and manage hiring stages."/>
    <ErrorState title="Invalid applicant filters"
      description="The requested search, status, screening or page is invalid."
      action={<TextLink href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9 w-full md:w-auto">Clear filters</TextLink>}/>
  </div>;
  const [pipelineResult,filterResult,jobResult]=await Promise.allSettled([
    getCollegeApplicationPipeline(context,jobId,query),
    listCollegeDriveApplicationFilters(context),
    getPlacementJobLegacyDetail(context,jobId),
  ]);
  const snapshotKey=[context.user.id,context.adminScope.collegeId,jobId,retryHref].join(":");
  if(pipelineResult.status==="rejected"){
   // This is a server-rendered, scope-bound read: do not recycle data from a
   // different selected college or imply that it is still current.
   return <LastKnownGoodApplications key={snapshotKey} valid={false} retryHref={retryHref}>
    <div className="min-w-0 space-y-5">
    <PageHeader title="Applications"/>
    <ErrorState title="Failed to load data"
     description="Failed to load job and applications. Please try again. The selected college's application rows could not be verified."
     action={<div className="flex flex-wrap gap-3">
      <TextLink href={retryHref}>Retry applications</TextLink>
      <TextLink href={"/admin/placements/jobs/"+encodeURIComponent(jobId)}>Drive overview</TextLink>
     </div>}/>
   </div></LastKnownGoodApplications>;
  }
  const data=pipelineResult.value;
  const filters=filterResult.status==="fulfilled"?filterResult.value:null;
  const job=jobResult.status==="fulfilled"?jobResult.value:null;
  const root="/admin/placements/jobs/"+encodeURIComponent(jobId);
  const navItems=[
    {label:"Overview",href:root+preserved},
    {label:"Applications",href:resetHref+preserved},
    {label:"Schedule",href:root+"/schedule"+preserved},
    {label:"Settings",href:root+"/settings"+preserved},
  ];
  const totalStageCount=Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0);
  return <LastKnownGoodApplications key={snapshotKey} valid retryHref={retryHref}>
   <div className="min-w-0 space-y-4 md:space-y-6">
    
    <PageHeader title={"Applications ("+formatNumberIN(data.total)+")"}
      description="Review applications, move candidates through hiring stages and notify them about decisions."
      actions={<div className="flex flex-wrap gap-2">
        <TextLink href="/admin/placements" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Back to Jobs</TextLink>
        <ButtonLink variant="secondary" href={retryHref}>↻ Refresh</ButtonLink>
      </div>} />
    <nav aria-label="Drive breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <TextLink href={returnTo}>
        Drives
      </TextLink><span aria-hidden="true">›</span>
      <TextLink href={root+preserved}>
        {job?.title||data.drive.title||"Drive #"+jobId.slice(0,8)}
      </TextLink>
    </nav>
    <CollegeDriveApplicationsSizeControl
      action={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"}
      query={query}/>
    <nav aria-label="Drive workspace" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-2">
      {navItems.map(item=><TextLink variant="bare" key={item.label} href={item.href} aria-current={item.label==="Applications"?"page":undefined}
        className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-4 text-sm font-semibold md:min-h-9 "+
          (item.label==="Applications"?"border-b-2 border-[var(--lms-primary)] bg-primary-subtle text-primary-text":"text-body hover:bg-primary-subtle hover:text-primary-text")}>
        {item.label}
      </TextLink>)}
    </nav>
    <section aria-label="Drive details" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading level={2} size="lg" className="text-foreground">{job?.title||data.drive.title}</Heading>
          <p className="mt-1 text-sm text-body">{job?.companyName||"Company unavailable"}
            {job?.locations?" · "+job.locations:""}
          </p>
        </div>
        <StatusBadge tone={job?.status==="PUBLISHED"?"success":"neutral"}>
          {job?.status??"Status unavailable"}
        </StatusBadge>
      </div>
      <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-[var(--lms-radius-md)] border border-[var(--lms-canvas-border)] sm:grid-cols-4 lg:grid-cols-5">
        {(["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED"] as const).map(stage=>
          <div key={stage} className="border-r border-b border-[var(--lms-canvas-border)] bg-surface px-3 py-2 last:border-r-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {stage.charAt(0)+stage.slice(1).toLowerCase()}
            </p>
            <p className="text-xl font-semibold text-foreground">{data.stageCounts[stage]??0}</p>
          </div>)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {totalStageCount} applications across recorded pipeline statuses.
      </p>
    </section>
    {query.attention!=="ALL"?<Banner tone="info" role="status">
      Showing candidates matching {query.attention==="OFFERED_NO_LETTER"
       ?"issued or accepted offers without a letter"
       :query.attention==="INTERVIEW_UNSCHEDULED"
        ?"the interview stage without a booked slot"
        :"applications still awaiting review after one week"}.
      {" "}<TextLink href={resetHref+preserved}>
        Clear attention filter
      </TextLink>
    </Banner>:null}
    {filters===null?<Banner tone="warning" action={<TextLink href={retryHref}>Retry filter choices</TextLink>}>
      Department, program and batch options could not be loaded. The current applications remain visible; academic filter choices are unavailable.
    </Banner>:null}
    <form method="get" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-4" aria-label="Filter job applications">
      {shortlisted?<Input type="hidden" name="shortlisted" value="true"/>:null}
      {query.attention!=="ALL"?<Input type="hidden" name="attention" value={query.attention}/>:null}
      {preserved?<Input type="hidden" name="returnTo" value={returnTo}/>:null}
      <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
      <Label stack className="min-w-0">Name, email, roll or role
        <Input name="q" defaultValue={query.q} maxLength={100} className="min-h-11 w-full md:min-h-9" />
      </Label>
      <Label stack className="min-w-0">Application
        <Select name="status" defaultValue={query.status} className="min-h-11 w-full md:min-h-9">
          {["ALL","SUBMITTED","WITHDRAWN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </Label>
      <Label stack className="min-w-0">Sort applications
        <Select name="sort" defaultValue={query.sort??"AGE_ASC"} className="min-h-11 w-full md:min-h-9">
          <option value="AGE_ASC">Age: youngest first</option><option value="AGE_DESC">Age: oldest first</option>
          <option value="SCORE_ASC">Match Score: lowest first</option><option value="SCORE_DESC">Match Score: highest first</option>
          <option value="SUBMITTED_DESC">Recently applied first</option>
        </Select>
      </Label>
      <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
      </div>
      <Disclosure title="Filters" defaultOpen={true} className="min-w-0">
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2 lg:grid-cols-3">
      <Label stack className="min-w-0">Screening
        <Select name="screening" defaultValue={query.screening} className="min-h-11 w-full md:min-h-9">
          {["ALL","PENDING","HOLD","SHORTLISTED","REJECTED","UNRECORDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </Label>
      <Label stack className="min-w-0">Source
        <Select name="source" defaultValue={query.source} className="min-h-11 w-full md:min-h-9">
          {["ALL","INTERNAL","EXTERNAL"].map(item=><option key={item} value={item}>{item==="ALL"?"All sources":item}</option>)}
        </Select>
      </Label>
      <Label stack className="min-w-0">Department
        <Select name="departmentId" defaultValue={query.departmentId??""} className="min-h-11 w-full md:min-h-9">
          <option value="">All departments</option>
          {query.departmentId&&!(filters?.departments??[]).some(item=>item.id===query.departmentId)&&
            <option value={query.departmentId}>Selected department</option>}
          {(filters?.departments??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </Label>
      <Label stack className="min-w-0">Program
        <Select name="programId" defaultValue={query.programId??""} className="min-h-11 w-full md:min-h-9">
          <option value="">All programs</option>
          {query.programId&&!(filters?.programs??[]).some(item=>item.id===query.programId)&&
            <option value={query.programId}>Selected program</option>}
          {(filters?.programs??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </Label>
      <Label stack className="min-w-0">Batch
        <Select name="cohortId" defaultValue={query.cohortId??""} className="min-h-11 w-full md:min-h-9">
          <option value="">All batches</option>
          {query.cohortId&&!(filters?.cohorts??[]).some(item=>item.id===query.cohortId)&&
            <option value={query.cohortId}>Selected batch</option>}
          {(filters?.cohorts??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
      </Label>
      <Label stack>Applied after (IST)
       <Input name="appliedFrom" type="date" defaultValue={query.appliedFrom??""}/>
      </Label>
      <Label stack>Applied before (IST)
       <Input name="appliedTo" type="date" defaultValue={query.appliedTo??""}/>
      </Label>
      <Label stack>Minimum assessment score (%)
       <Input name="minScore" type="number" min={0} max={100} step={1} defaultValue={query.minScore??""}/>
      </Label>
      <Label stack>Maximum assessment score (%)
       <Input name="maxScore" type="number" min={0} max={100} step={1} defaultValue={query.maxScore??""}/>
      </Label>
      <Label stack>Skills
       <Input name="skills" type="search" maxLength={100} defaultValue={query.skills} placeholder="Profile skill"/>
      </Label>
      <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
       Score filters use applied round evidence, not unavailable automated screening scores.
       Applicants without a recorded round score are excluded when a score range is set.
      </p>
        </div>
      </Disclosure>
      <TextLink href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/applications"} className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>
    </form>
    <nav className="flex min-w-0 flex-wrap items-center gap-3 text-sm" aria-label="Application views">
      <TextLink href={resetHref}>All applications</TextLink>
      <TextLink href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/shortlisted"}>Manage Shortlisted · Assessment</TextLink>
    </nav>
    <div className="min-w-0">
    <Tabs ariaLabel="Application pipeline stages" value={query.stage} renderPanel={false}
      items={(shortlisted?(["ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED"] as const):
        (["ALL","APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const)).map(stage=>({
       value:stage,label:stage==="ALL"?"All":stage.charAt(0)+stage.slice(1).toLowerCase(),
       count:stage==="ALL"?Object.values(data.stageCounts).reduce((sum,num)=>sum+num,0):data.stageCounts[stage]??0,
       href:(()=>{
        const href=adminHref(jobId,{...query,stage,page:1});
        const extras=new URLSearchParams();
        if(shortlisted)extras.set("shortlisted","true");
        if(preserved)extras.set("returnTo",returnTo);
        return href+(extras.size?(href.includes("?")?"&":"?")+extras.toString():"");
       })(),
      }))}/>
    </div>
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold">Applications ({formatNumberIN(data.total)})</span>
      <SuperAdminDriveApplicationsCsvControl
       href={`/api/college/placements/jobs/${encodeURIComponent(jobId)}/applications/export${adminHref(jobId,query,true).split("/export")[1] ?? ""}`}
       limit={DRIVE_APPLICATION_EXPORT_CAP}/>
    </div>
    {!data.storageReady?<section className="space-y-3">
      <Banner tone="warning">Application stage actions are awaiting migration registration. You can still review the scoped applicant register.</Banner>
      <div className="min-w-0 overflow-x-auto" role="region" aria-label="Applications table" tabIndex={0}>
      <DataTable<(typeof data.items)[number]> rows={data.items} getRowKey={row=>row.id}
       caption="Drive applications" columns={[
        {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.name??"Unnamed learner"},
        {key:"roll",header:"Roll",mobilePriority:"secondary",cell:row=>row.rollNumber??"Not recorded"},
        {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle},
        {key:"application",header:"Application",mobilePriority:"secondary",cell:row=><StatusBadge tone={row.status==="SUBMITTED"?"info":row.status==="REJECTED"?"error":row.status==="WITHDRAWN"?"neutral":"warning"}>{row.status}</StatusBadge>},
        {key:"screening",header:"Screening",mobilePriority:"secondary",cell:row=>row.screening??"Not recorded"},
       ]} empty={<EmptyState title="No matching applications"
          description={query.q||query.status!=="ALL"||query.stage!=="ALL"?"No applications match these filters.":"No applications yet."}/>}/>
      </div>
     </section>:
     <div className="min-w-0 overflow-x-auto" role="region" aria-label="Candidate pipeline" tabIndex={0}>
       <CollegeApplicationPipelineControls jobId={jobId} rows={data.items} total={data.total}
         query={query} basePath="/admin/placements"/>
     </div>}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] sm:flex-row sm:items-center sm:justify-between">
      <p role="status" className="text-sm text-muted-foreground">Page {query.page} of {data.totalPages}
        · 20 applications per page</p>
      <Pagination page={query.page} pageCount={data.totalPages} label="Application pagination"
        hrefForPage={page=>adminHref(jobId,{...query,page})}/>
    </div>
    <p className="text-xs text-muted-foreground">
      CSV uses formula-neutralized cells, includes filtered rows up to {formatNumberIN(DRIVE_APPLICATION_EXPORT_CAP)},
      and includes a truncation notice if more matching rows exist.
    </p>
  </div></LastKnownGoodApplications>;
}
