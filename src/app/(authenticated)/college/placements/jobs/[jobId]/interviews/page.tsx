import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {Alert} from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { driveInterviewDateIst, driveInterviewsHref, driveInterviewsParams, driveRoundTime, filterDriveCandidateAppointments, driveInterviewFilterError } from "@/modules/placements/college-drive-interviews-model";
import { listCollegeDriveInterviews } from "@/modules/placements/college-drive-interviews-service";
import { getCollegeRoundSlotAppointments } from "@/modules/placements/college-round-slot-action-service";
import { CollegeInterviewAppointments } from "@/components/placements/college-interview-appointments";
import {Select} from "@/components/ui/select";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {CollegeDriveScheduleRefresh} from "@/components/placements/college-drive-schedule-refresh";
import {collegeInterviewConflictIds} from "@/modules/placements/college-interview-conflicts-model";

export default async function CollegeDriveInterviewsPage({params,searchParams}:{
  params:Promise<{jobId:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await getCurrentRequestContext();
  if(!context.membership) return <div className="space-y-4">
    <PageHeader title="Interviews"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator for a College Admin assignment before opening a placement drive."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
  </div>;
  const access=await resolveOptionalModuleAccess(context);
  if(!access.placements.enabled)return <section role="status" className="min-w-0 space-y-4">
    <PageHeader title="Interviews"/>
    <Alert tone="warning" title="Placements is switched off for this college">
      Interview schedules and applicant actions are not available while the
      Placements module is disabled. Existing records are retained. Ask a
      Super Admin to enable the module, then revisit this page.
    </Alert>
    <Link href="/college/module-access"
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
      View college module access
    </Link>
  </section>;
  const {jobId}=await params;
  const rawFilters=await searchParams;
  const conflictOnly=rawFilters.conflicts==="1";
  const query=driveInterviewsParams(rawFilters);
  if(!query) return <ErrorState title="Invalid interview filters"
    description={driveInterviewFilterError(await searchParams)} action={<Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/interviews`} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>;
  const [data,appointments]=await Promise.all([
    listCollegeDriveInterviews(context,jobId,query),
    getCollegeRoundSlotAppointments(context,jobId,{
      appointmentPage:query.appointmentPage,
      appointmentStatus:query.appointmentStatus,
      appointmentMode:query.appointmentMode,
      appointmentSearch:query.appointmentSearch,
      appointmentSort:query.appointmentSort,
      appointmentPageSize:query.appointmentPageSize,
      preferredApplicationId:query.applicationId,
      candidatePage:query.candidatePage,
      candidatePageSize:query.candidatePageSize,
      candidateSearch:query.candidateSearch,
    }),
  ]);
  const base="/college/placements/jobs/"+encodeURIComponent(jobId);
  const appointmentRows=filterDriveCandidateAppointments(appointments.interviews,{
    appointmentStatus:query.appointmentStatus,mode:query.appointmentMode,
    search:query.appointmentSearch,
  });
  const scheduled=appointments.interviews.filter(item=>
    ["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"].includes(item.status));
  const conflictIds=collegeInterviewConflictIds(appointments.interviews);
  const todayIst=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const dateIst=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso));
  const interviewToday=scheduled.filter(item=>dateIst(item.scheduledAt)===todayIst).length;
  const conflictIds=collegeInterviewConflictIds(appointments.interviews);
  const conflicts=conflictIds.size;
  const visibleAppointments=conflictOnly?appointmentRows.filter(item=>conflictIds.has(item.id)):appointmentRows;
  const baseConflictHref=driveInterviewsHref(jobId,query);
  const toggleConflictHref=conflictOnly?baseConflictHref:
    baseConflictHref+(baseConflictHref.includes("?")?"&":"?")+"conflicts=1";
  const driveTitle=data.job.title||appointments.job.title;
  const companyHue=[...driveTitle].reduce((n,char)=>(n*31+char.charCodeAt(0))%360,0);
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"round",header:"Round",mobilePriority:"primary",cell:item=><div>
      <p className="font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground leading-5">{item.kind==="INTERVIEW"?"Interview":"Group discussion"} · Round {item.sequence}</p>
    </div>},
    {key:"time",header:"Time",cell:item=>driveRoundTime(item.scheduledAt,item.timezone)},
    {key:"venue",header:"Venue",cell:item=>item.venue??"Not recorded"},
    {key:"mode",header:"Mode",cell:item=>item.mode??"Not recorded"},
    {key:"status",header:"Round status",cell:item=><StatusBadge tone={item.status==="COMPLETED"?"success":item.status==="CANCELLED"?"error":"info"}>{item.status==="PENDING"?"Pending":item.status==="SCHEDULED"?"Scheduled":item.status==="COMPLETED"?"Completed":"Cancelled"}</StatusBadge>},
  ];
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <CollegeDriveScheduleRefresh scopeKey={String(context.membership.id)+":"+jobId}/>
    <nav aria-label="Drive sections" className="flex min-w-0 flex-wrap border-b border-[var(--lms-canvas-border)] text-sm font-semibold">
      {([{name:"Overview",suffix:"overview"},{name:"Applications",suffix:"applications"},
        {name:"Schedule",suffix:"interviews"},{name:"Settings",suffix:"settings"}] as const).map(tab=>
        <Link key={tab.suffix} href={base+"/"+tab.suffix} aria-current={tab.suffix==="interviews"?"page":undefined}
          className={"inline-flex min-h-11 items-center border-b-[3px] px-4 md:min-h-9 "+
            (tab.suffix==="interviews"?"border-[var(--lms-teal-deep)] text-[var(--lms-teal-deep)]":
            "border-transparent text-body hover:text-link hover:border-border")}>{tab.name}</Link>)}
    </nav>
    <PageHeader title="Interviews"
      description="Review the interview schedule, conflicts and candidate context without leaving the placements workspace."
      actions={<div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs font-semibold text-body">This drive only</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold"
         style={{backgroundColor:"hsl("+companyHue+" 70% 94%)"}}><span aria-hidden="true" className="size-2 rounded-full"
         style={{backgroundColor:"hsl("+companyHue+" 52% 40%)"}}/>{driveTitle}</span>
        <Link href={driveInterviewsHref(jobId,query)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh</Link>
      </div>}/>
    <div className="grid min-w-0 grid-cols-2 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 text-sm sm:grid-cols-4"
      aria-label="Interview schedule summary">
      {([{label:"Scheduled (page)",value:scheduled.length},{label:"Today (page)",value:interviewToday},
        {label:"Companies (drive)",value:appointments.appointmentTotal?1:0},
        {label:"Conflicts (page)",value:conflicts}] as const).map(metric=>
        <div key={metric.label} className="min-w-0 border-r border-border px-2 last:border-r-0">
          <div className="text-2xl font-semibold text-[var(--lms-heading)]">{metric.value}</div>
          <div className="text-xs text-muted-foreground">{metric.label}</div>
        </div>)}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Link href={toggleConflictHref} role="button" aria-pressed={conflictOnly}
        className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 "+
          (conflictOnly?"border-[var(--lms-error)] bg-red-50 text-[var(--lms-error)]":"border-[var(--lms-error)] text-[var(--lms-error)] hover:bg-red-50")}>
        {conflictOnly?"Show all interviews":"Conflicts ("+conflicts+")"}
      </Link>
      {conflictOnly?<span role="status" className="text-sm text-[var(--lms-error)]">Showing {visibleAppointments.length} conflicting appointments on this page.</span>:null}
    </div>
    <form method="get" role="search" aria-label="Interview round filters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      {conflictOnly?<input type="hidden" name="conflicts" value="1"/>:null}
      {query.appointmentStatus&&query.appointmentStatus!=="ALL"?<input type="hidden" name="appointmentStatus" value={query.appointmentStatus}/>:null}
      {query.appointmentMode&&query.appointmentMode!=="ALL"?<input type="hidden" name="appointmentMode" value={query.appointmentMode}/>:null}
      {query.appointmentSearch?<input type="hidden" name="appointmentSearch" value={query.appointmentSearch}/>:null}
      {query.appointmentSort!=="DATE_ASC"?<input type="hidden" name="appointmentSort" value={query.appointmentSort}/>:null}
      {query.appointmentPageSize!==20?<input type="hidden" name="appointmentPageSize" value={query.appointmentPageSize}/>:null}
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round kind
        <Select name="kind" defaultValue={query.kind} >
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={query.status} >
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </Select>
      </label>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"><Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter</Button>
      {(query.kind!=="ALL" || query.status!=="ALL") ? <Link href={driveInterviewsHref(jobId,{...query,kind:"ALL",status:"ALL",page:1})} className="inline-flex min-h-11 items-center justify-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link> : null}</div>
    </form>
    <form method="get" role="search" aria-label="Candidate interview appointment filters"
      className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {conflictOnly?<input type="hidden" name="conflicts" value="1"/>:null}
      {query.kind!=="ALL"?<input type="hidden" name="kind" value={query.kind}/>:null}
      {query.status!=="ALL"?<input type="hidden" name="status" value={query.status}/>:null}
      {query.applicationId?<input type="hidden" name="applicationId" value={query.applicationId}/>:null}
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold">Appointment status
        <Select name="appointmentStatus" defaultValue={query.appointmentStatus??"ALL"}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold">Interview mode
        <Select name="appointmentMode" defaultValue={query.appointmentMode??"ALL"}>
          <option value="ALL">All modes</option><option value="ON_CAMPUS">In-person</option>
          <option value="VIRTUAL">Online</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold">Application
        <Input name="appointmentSearch" maxLength={120} defaultValue={query.appointmentSearch??""}
          placeholder="Search..."/>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold">Sort interviews
        <Select name="appointmentSort" aria-label="Sort interviews" defaultValue={query.appointmentSort}>
          <option value="DATE_ASC">Date earliest</option><option value="DATE_DESC">Date latest</option>
          <option value="JOB">Job title</option><option value="STATUS">Status</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold">Per page
        <Select name="appointmentPageSize" defaultValue={String(query.appointmentPageSize)}>
          {[10,20,50,100].map(size=><option key={size} value={size}>{size}</option>)}
        </Select>
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Filter interviews</Button>
        <Link href={driveInterviewsHref(jobId,{...query,appointmentStatus:"ALL",
          appointmentMode:"ALL",appointmentSearch:undefined,appointmentPage:1})}
          className="inline-flex min-h-9 items-center font-semibold text-link underline">Clear filters</Link>
      </div>
    </form>
    {visibleAppointments.length===0?<p className="text-sm text-muted-foreground" role="status">
      {appointments.appointmentTotal===0?"No interviews scheduled for this drive yet.":conflictOnly?"No conflicts match these filters.":"No interviews match these filters."}
    </p>:null}
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
      <span role="status">{appointments.appointmentTotal} interviews · page {appointments.appointmentPage} of {appointments.appointmentPages}</span>
      <span className="text-muted-foreground">Use Export CSV under Candidate interviews to download this page.</span>
    </div>
    {appointments.candidateTotal>appointments.candidates.length?<p role="status" className="text-sm text-warning-text">
      Showing {appointments.candidates.length} of {appointments.candidateTotal} shortlisted candidates (page {appointments.candidatePage} of {appointments.candidatePages}). Open a candidate from their application details to include that specific learner.
    </p>:null}
    <nav aria-label="Eligible candidate picker pages" className="flex flex-wrap items-center gap-3 text-sm">
      {appointments.candidatePage>1?<Link href={driveInterviewsHref(jobId,{...query,candidatePage:appointments.candidatePage-1})}
        className="inline-flex min-h-11 items-center font-semibold text-link underline">Previous candidates</Link>:null}
      {appointments.candidatePage<appointments.candidatePages?<Link href={driveInterviewsHref(jobId,{...query,candidatePage:appointments.candidatePage+1})}
        className="inline-flex min-h-11 items-center font-semibold text-link underline">Next candidates</Link>:null}
    </nav>
    {query.applicationId&&appointments.candidateConflicts.length>0?
      <aside role="alert" className="rounded-md border border-[var(--lms-warning-border)] p-3 text-sm">
        <strong>This learner already has other scheduled interviews.</strong>
        <ul className="mt-2 list-disc pl-5">
          {appointments.candidateConflicts.slice(0,5).map(conflict=><li key={conflict.id}>
            {conflict.jobTitle} · {driveInterviewDateIst(new Date(conflict.startsAt))}
          </li>)}
        </ul>
        {appointments.candidateConflictsHasMore||appointments.candidateConflicts.length>5?
          <p>Additional interviews exist; review the learner&apos;s schedule before booking.</p>:null}
        <p className="mt-1">Overlapping learner, room and interviewer bookings are checked again by the server before saving.</p>
      </aside>:null}
    <CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={visibleAppointments}
      preferredApplicationId={query.applicationId}/>
    <nav aria-label="Candidate interview appointment pages" className="flex flex-wrap items-center gap-4 border-b border-border pb-4 text-sm">
      {appointments.appointmentPage>1?<Link href={driveInterviewsHref(jobId,{...query,appointmentPage:appointments.appointmentPage-1})}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous appointments</Link>:null}
      {appointments.appointmentPage<appointments.appointmentPages?<Link href={driveInterviewsHref(jobId,{...query,appointmentPage:appointments.appointmentPage+1})}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next appointments</Link>:null}
    </nav>
    <section aria-label="Persisted interview rounds" className="space-y-2">
      <p role="status" className="text-sm text-body leading-[22px]">{data.total} interview/GD rounds in this view</p>
      <div className="flex flex-wrap gap-2" aria-label="Interview type indicators">
        {(["SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"] as const).map((kind,index)=>
          <span key={kind} className={"rounded-full border px-2 py-1 text-xs font-semibold "+
            (index===0?"border-sky-200 bg-sky-50 text-sky-800":
             index===1?"border-indigo-200 bg-indigo-50 text-indigo-800":
             index===2?"border-emerald-200 bg-emerald-50 text-emerald-800":
             index===3?"border-amber-200 bg-amber-50 text-amber-800":
             "border-violet-200 bg-violet-50 text-violet-800")}>
            {kind.charAt(0)+kind.slice(1).toLowerCase()}
          </span>)}
      </div>
      <DataTable caption="Persisted interview rounds" columns={columns} rows={data.items}
        getRowKey={item=>item.id} empty={<EmptyState title="No matching interview rounds" description={data.total===0?"No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."} action={<Link href={data.total===0?driveInterviewsHref(jobId,{...query,kind:"ALL",status:"ALL",page:1}):driveInterviewsHref(jobId,{...query,page:Math.max(1,query.page-1)})} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">{data.total===0?"Clear filters":"Previous page"}</Link>}/>} />
    </section>
    <nav aria-label="Interview round pages" className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-border pt-[var(--lms-space-3)] text-sm text-body sm:flex-row sm:items-center">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&_a]:flex-1 max-[767px]:[&_a]:justify-center">
        {query.page>1?<Link href={driveInterviewsHref(jobId,{...query,page:query.page-1})} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:null}
        {query.page<data.totalPages?<Link href={driveInterviewsHref(jobId,{...query,page:query.page+1})} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground leading-5">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
