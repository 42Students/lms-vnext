import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
import { Banner } from "@/components/ui/banner";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { driveInterviewDateIst, driveInterviewsHref, driveInterviewsParams, driveRoundTime } from "@/modules/placements/college-drive-interviews-model";
import { listCollegeDriveInterviews } from "@/modules/placements/college-drive-interviews-service";
import { getCollegeRoundSlotAppointments } from "@/modules/placements/college-round-slot-action-service";
import { CollegeInterviewAppointments } from "@/components/placements/college-interview-appointments";

function adminInterviewsHref(...args:Parameters<typeof driveInterviewsHref>){
 return driveInterviewsHref(...args)
  .replace("/college/placements/","/admin/placements/")
  .replace("/interviews","/schedule");
}
export default async function SuperAdminDriveSchedulePage({params,searchParams}:{
  params:Promise<{jobId:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Drives" description="Placement administration requires a college safety scope." />
    <Banner role="alert" tone="warning">
      <strong>Select a college to continue.</strong> Pick an Organization + College in the header to manage this drive schedule.{" "}
      <Link href="/admin/placements" className="font-semibold text-primary-text underline">Go Back</Link>
    </Banner>
  </div>;
  // Validate the platform actor and selected tenant before reading private rounds.
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId}=await params;
  const rawSearchParams=await searchParams;
  const conflictsOnly=rawSearchParams.conflictsOnly==="1";
  const query=driveInterviewsParams(rawSearchParams);
  if(!query) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Interviews" description="Schedule candidate interviews and review interview rounds."/>
    <ErrorState title="Invalid interview filters"
      description="Round kind, status or page is invalid. No records were loaded."
      action={<Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/schedule"}
        className="font-semibold text-primary-text underline w-full md:w-auto min-h-11 md:min-h-9">Clear filters</Link>}/>
  </div>;
  // Round metadata must not take down candidate appointments, or vice versa.
  const [roundResult,appointmentResult]=await Promise.allSettled([
    listCollegeDriveInterviews(context,jobId,query),
    getCollegeRoundSlotAppointments(context,jobId,{
      appointmentPage:query.appointmentPage,
      appointmentStatus:query.appointmentStatus,
      appointmentMode:query.appointmentMode,
      appointmentSearch:query.appointmentSearch,
      appointmentPageSize:query.appointmentPageSize,
      appointmentSort:query.appointmentSort,
      preferredApplicationId:query.applicationId,
      candidatePage:query.candidatePage,
      candidatePageSize:query.candidatePageSize,
      candidateSearch:query.candidateSearch,
    }),
  ]);
  if(roundResult.status==="rejected"&&roundResult.reason instanceof AuthorizationError)
    throw roundResult.reason;
  if(appointmentResult.status==="rejected"&&appointmentResult.reason instanceof AuthorizationError)
    throw appointmentResult.reason;
  const data=roundResult.status==="fulfilled"?roundResult.value:null;
  const appointments=appointmentResult.status==="fulfilled"?appointmentResult.value:null;
  const refreshHref=adminInterviewsHref(jobId,query);
  const root="/admin/placements/jobs/"+encodeURIComponent(jobId);
  const resetHref=root+"/schedule";
  const candidateRows=appointments?.interviews??[];
  const candidateCount=appointments?.appointmentTotal??0;
  // These conflicts are deliberately limited to this drive's authorized
  // appointment page. Venue/learner/panel overlaps are not asserted as a
  // system-wide conflict scan over unrequested candidates or other drives.
  const conflictIds=new Set<string>();
  for(let i=0;i<candidateRows.length;i++){
    const left=candidateRows[i]!;
    const leftFrom=Date.parse(left.scheduledAt);
    const leftTo=leftFrom+left.durationMinutes*60_000;
    if(!["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"].includes(left.status)||!Number.isFinite(leftFrom))continue;
    for(let j=i+1;j<candidateRows.length;j++){
      const right=candidateRows[j]!;
      const rightFrom=Date.parse(right.scheduledAt);
      const rightTo=rightFrom+right.durationMinutes*60_000;
      if(!["SCHEDULED","CONFIRMED","RESCHEDULE_REQUESTED"].includes(right.status)||!Number.isFinite(rightFrom)||
         leftFrom>=rightTo||rightFrom>=leftTo)continue;
      const sameApplicant=Boolean(left.applicationId&&
        left.applicationId===right.applicationId);
      const sameVenue=Boolean(left.venue&&right.venue&&
        left.venue.trim().toLowerCase()===right.venue.trim().toLowerCase());
      const samePanel=Boolean(left.interviewer&&right.interviewer&&
        left.interviewer.trim().toLowerCase()===right.interviewer.trim().toLowerCase());
      if(sameApplicant||sameVenue||samePanel){
        conflictIds.add(left.id);conflictIds.add(right.id);
      }
    }
  }
  const visibleCandidateRows=conflictsOnly
    ?candidateRows.filter(item=>conflictIds.has(item.id)):candidateRows;
  const addConflictParam=(href:string)=>conflictsOnly
    ?href+(href.includes("?")?"&":"?")+"conflictsOnly=1":href;
  const conflictHref=conflictsOnly
    ?refreshHref:refreshHref+(refreshHref.includes("?")?"&":"?")+"conflictsOnly=1";
  const csvCell=(value:string|number|null|undefined)=>{
    const raw=String(value??"");
    // Prevent spreadsheet formula execution when exported text is opened.
    const safe=/^\s*[=+\-@]/.test(raw)?"'"+raw:raw;
    return '"'+safe.replaceAll('"','""')+'"';
  };
  const appointmentCsv=[
    ["Appointment ID","Application ID","Round ID","Start (UTC)","Duration (minutes)",
      "Mode","Venue","Panel","Status"].map(csvCell).join(","),
    ...visibleCandidateRows.map(item=>
      [item.id,item.applicationId,item.roundId,item.scheduledAt,item.durationMinutes,
       item.mode,item.venue,item.interviewer,item.status].map(csvCell).join(",")),
  ].join("\r\n")+"\r\n";
  const exportHref="data:text/csv;charset=utf-8,"+encodeURIComponent("\uFEFF"+appointmentCsv);
  const nowMs=Date.now();
  const istDay=(date:Date)=>new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"
  }).format(date);
  const todayIst=istDay(new Date(nowMs));
  const todayCount=candidateRows.filter(row=>
    istDay(new Date(row.scheduledAt))===todayIst).length;
  const upcomingCount=candidateRows.filter(row=>
    row.status==="SCHEDULED"&&Date.parse(row.scheduledAt)>=nowMs).length;
  const completedCount=candidateRows.filter(row=>row.status==="COMPLETED").length;
  const cancelledCount=candidateRows.filter(row=>
    row.status==="CANCELLED"||row.status==="NO_SHOW").length;
  const activeCandidateFilters=Boolean(conflictsOnly||query.appointmentSearch||
    (query.appointmentMode&&query.appointmentMode!=="ALL")||
    (query.appointmentStatus&&query.appointmentStatus!=="ALL"));
  const navItems=[
    {name:"Overview",href:root},
    {name:"Applications",href:root+"/applications"},
    {name:"Schedule",href:resetHref},
    {name:"Settings",href:root+"/settings"},
  ];
  type RoundRow=Awaited<ReturnType<typeof listCollegeDriveInterviews>>["items"][number];
  const columns:DataTableColumn<RoundRow>[]=[
    {key:"round",header:"Round",mobilePriority:"primary",cell:item=><>
      <strong>{item.name}</strong><p className="text-xs text-muted-foreground">
        <StatusBadge tone={item.kind==="GD"?"warning":"info"}>
          {item.kind==="GD"?"Group Discussion":"Interview"}
        </StatusBadge> · Round {item.sequence}</p></>},
    {key:"time",header:"Time",mobilePriority:"secondary",cell:item=>driveRoundTime(item.scheduledAt,item.timezone)},
    {key:"venue",header:"Venue",mobilePriority:"secondary",cell:item=>item.venue??"Not recorded"},
    {key:"mode",header:"Mode",mobilePriority:"secondary",cell:item=>item.mode??"Not recorded"},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="COMPLETED"?"success":item.status==="SCHEDULED"?"info":item.status==="CANCELLED"?"error":"warning"}>{item.status}</StatusBadge>},
    {key:"slots",header:"Candidate slots",mobilePriority:"secondary",cell:()=> "See candidate interviews above"},
  ];
  return <div className="min-w-0 space-y-5">
    <nav aria-label="Drive breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/admin/placements/drives" className="font-semibold text-primary-text hover:underline">Drives</Link>
      <span aria-hidden="true">›</span>
      <Link href={root} className="font-semibold text-primary-text hover:underline">
        {data?.job.title??appointments?.job.title??"Drive #"+jobId.slice(0,8)}
      </Link>
    </nav>
    <PageHeader title="Calendar"
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-body">
          This drive only
        </span>
        <Link href={refreshHref} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>
          </svg> Refresh
        </Link>
      </div>}/>
    <Tabs ariaLabel="Drive workspace" value="Schedule" renderPanel={false}
      items={navItems.map(item=>({value:item.name,label:item.name,href:item.href}))}/>
    <div className="grid min-w-0 grid-cols-2 divide-x-0 divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
      {[
        {label:"Today (this page)",count:todayCount},
        {label:"Upcoming (this page)",count:upcomingCount},
        {label:"Completed (this page)",count:completedCount},
        {label:"Cancelled / No show (this page)",count:cancelledCount},
      ].map(item=><div key={item.label}
        className="min-w-0 px-3 py-3 first:pl-0 last:pr-0">
        <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{item.count}</p>
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground" role="status">
      {candidateCount} matching interviews · counts above reflect appointments loaded on this page.
    </p>
    <form method="get" aria-label="Filter interviews"
      className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <input type="hidden" name="appointmentPage" value="1"/>
      {conflictsOnly?<input type="hidden" name="conflictsOnly" value="1"/>:null}
      <input type="hidden" name="page" value="1"/>
      <label className="grid min-w-0 gap-2 text-sm font-semibold text-muted-foreground">
        Search
        <Input type="search" name="appointmentSearch" maxLength={120}
          placeholder="Search..." defaultValue={query.appointmentSearch??""}
          className="min-h-11 md:min-h-9"/>
      </label>
      {query.applicationId?<Input type="hidden" name="applicationId" value={query.applicationId}/>:null}
      <label className="grid gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Type
        <Select name="kind" defaultValue={query.kind} className="min-w-0">
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </Select>
      </label>
      <label className="grid gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={query.status} className="min-w-0">
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-muted-foreground">Mode
        <Select name="appointmentMode" defaultValue={query.appointmentMode??"ALL"} className="min-h-11 md:min-h-9">
          <option value="ALL">All modes</option>
          <option value="ON_CAMPUS">In person</option>
          <option value="VIRTUAL">Online</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-muted-foreground">Candidate status
        <Select name="appointmentStatus" defaultValue={query.appointmentStatus??"ALL"} className="min-h-11 md:min-h-9">
          <option value="ALL">All</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled / No Show</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-muted-foreground">Sort
        <Select name="appointmentSort" defaultValue={query.appointmentSort} className="min-h-11 md:min-h-9">
          <option value="DATE_ASC">Date (earliest first)</option>
          <option value="DATE_DESC">Date (latest first)</option>
          <option value="JOB">Job title</option><option value="STATUS">Status</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-muted-foreground">Rows per page
        <Select name="appointmentPageSize" defaultValue={String(query.appointmentPageSize)} className="min-h-11 md:min-h-9">
          {[10,20,50,100].map(size=><option key={size} value={String(size)}>{size}</option>)}
        </Select>
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
        <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
        <Link href={resetHref}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
          Clear filters
        </Link>
      </div>
    </form>
    <div className="flex min-w-0 flex-wrap gap-3 print:hidden">
      <Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/schedule"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        Clear filters
      </Link>
      <Link href={addConflictParam(refreshHref)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        Refresh interviews
      </Link>
      <Link href={conflictHref}
        aria-current={conflictsOnly?"page":undefined}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        {conflictsOnly?"Show all appointments":"Show possible overlaps (this page)"}
      </Link>
      <a href={exportHref} download="drive-interviews.csv"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        Export visible appointments (CSV)
      </a>
    </div>
    <section aria-label="Candidate interviews" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
       <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Candidate interviews</h2>
       <Link href={conflictHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
        {conflictsOnly?"Show all interviews":"Only schedule conflicts"} ({conflictIds.size} on this page)
       </Link>
      </div>
      {conflictsOnly?<Banner tone="info">Only conflicts found among the interviews loaded on this page are shown. Other drives and unloaded pages are not part of this preview.</Banner>:null}
      {appointments&&appointments.appointmentTotal===0?<p role="status" className="text-sm text-muted-foreground">
        {activeCandidateFilters?"No interviews match your current filters.":"No interviews scheduled for this drive yet."}
      </p>:null}
      {appointments ? <>
        {appointments.candidateTotal>appointments.candidates.length?<Banner tone="warning">
          Showing {appointments.candidates.length} of {appointments.candidateTotal} shortlisted candidates (page {appointments.candidatePage} of {appointments.candidatePages}). Deep-link from the application detail to include an individual learner.
        </Banner>:null}
        <nav aria-label="Eligible candidate picker pages" className="flex flex-wrap items-center gap-3 text-sm">
          {appointments.candidatePage>1?<Link href={addConflictParam(adminInterviewsHref(jobId,{...query,candidatePage:appointments.candidatePage-1}))}
            className="inline-flex min-h-11 items-center font-semibold text-link underline">Previous candidates</Link>:null}
          {appointments.candidatePage<appointments.candidatePages?<Link href={addConflictParam(adminInterviewsHref(jobId,{...query,candidatePage:appointments.candidatePage+1}))}
            className="inline-flex min-h-11 items-center font-semibold text-link underline">Next candidates</Link>:null}
        </nav>
        <p role="status" className="text-sm text-body">{appointments.appointmentTotal} matching candidate appointments · page {appointments.appointmentPage} of {appointments.appointmentPages}
          · {appointments.appointmentPageSize} per page{conflictsOnly?" · "+visibleCandidateRows.length+" possible overlaps on this page":""}</p>
        {query.applicationId&&appointments.candidateConflicts.length>0?
          <Banner tone="warning">
            <strong>This learner already has scheduled interviews in this college.</strong>
            <ul className="mt-2 list-disc pl-5">
              {appointments.candidateConflicts.slice(0,5).map(conflict=><li key={conflict.id}>
                {conflict.jobTitle} · {driveInterviewDateIst(new Date(conflict.startsAt))}
              </li>)}
            </ul>
            {appointments.candidateConflictsHasMore||appointments.candidateConflicts.length>5?
              <p>More interviews exist; review the learner schedule.</p>:null}
            <p>The server checks overlap and staff concurrency before scheduling.</p>
          </Banner>:null}
        <CollegeInterviewAppointments jobId={jobId}
          rounds={appointments.rounds} candidates={appointments.candidates}
          appointments={visibleCandidateRows} preferredApplicationId={query.applicationId}/>
        <nav aria-label="Candidate interview appointment pages" className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
          {appointments.appointmentPage>1?<Link href={addConflictParam(adminInterviewsHref(jobId,{...query,appointmentPage:appointments.appointmentPage-1}))}
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous appointments</Link>:null}
          {appointments.appointmentPage<appointments.appointmentPages?<Link href={addConflictParam(adminInterviewsHref(jobId,{...query,appointmentPage:appointments.appointmentPage+1}))}
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Next appointments</Link>:null}
        </nav>
      </> :
        <ErrorState title="Unable to load interviews. Please try again."
          description="Candidate interview appointments could not be refreshed. No empty or stale schedule is being represented as current."
          action={<Link href={refreshHref}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
            Refresh
          </Link>}/>}
    </section>
    <section aria-label="Persisted interview rounds" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)]">
      <h2 className="font-semibold text-[var(--lms-heading)]">Interview and GD rounds</h2>
      {data ? <>
        <p className="text-sm text-muted-foreground">{data.total.toLocaleString("en-IN")} matching interview/GD rounds</p>
        <DataTable columns={columns} rows={data.items} getRowKey={item=>item.id}
          caption="Persisted interview rounds"
          empty={<EmptyState title={data.total===0?"No matching interview rounds":"No rounds on this page"}
            description={data.total===0?"No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."}/>}/>
      </> : <Banner tone="warning"
        action={<Link href={refreshHref} className="font-semibold text-primary-text underline">
          Retry rounds
        </Link>}>
        Unable to load interview rounds. Candidate appointments above remain independently available.
      </Banner>}
    </section>
    {data ? <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">Page {query.page} of {data.totalPages}</p>
      <Pagination page={query.page} pageCount={data.totalPages}
        hrefForPage={page=>adminInterviewsHref(jobId,{...query,page})} label="Interview round pages"/>
    </div> : null}
    <p className="text-xs text-muted-foreground">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
