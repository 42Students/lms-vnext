import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
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
import { driveInterviewsHref, driveInterviewsParams, driveRoundTime } from "@/modules/placements/college-drive-interviews-model";
import { listCollegeDriveInterviews } from "@/modules/placements/college-drive-interviews-service";
import { getCollegeRoundSlotAppointments } from "@/modules/placements/college-round-slot-action-service";
import { CollegeInterviewAppointments } from "@/components/placements/college-interview-appointments";

function adminInterviewsHref(...args:Parameters<typeof driveInterviewsHref>){
 return driveInterviewsHref(...args).replace("/college/placements/","/admin/placements/");
}
export default async function SuperAdminDriveSchedulePage({params,searchParams}:{
  params:Promise<{jobId:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Drives" description="Placement administration requires a college safety scope." />
    <EmptyState title="Choose a college" description="Select a college in the Super Admin scope selector to manage its drives."/>
  </div>;
  // Validate the platform actor and selected tenant before reading private rounds.
  requireSuperAdminSelectedCollege(context,"placements.manage");
  const {jobId}=await params;
  const query=driveInterviewsParams(await searchParams);
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
      preferredApplicationId:query.applicationId,
    }),
  ]);
  if(roundResult.status==="rejected"&&roundResult.reason instanceof AuthorizationError)
    throw roundResult.reason;
  if(appointmentResult.status==="rejected"&&appointmentResult.reason instanceof AuthorizationError)
    throw appointmentResult.reason;
  const data=roundResult.status==="fulfilled"?roundResult.value:null;
  const appointments=appointmentResult.status==="fulfilled"?appointmentResult.value:null;
  const refreshHref=adminInterviewsHref(jobId,query);
  type RoundRow=Awaited<ReturnType<typeof listCollegeDriveInterviews>>["items"][number];
  const columns:DataTableColumn<RoundRow>[]=[
    {key:"round",header:"Round",mobilePriority:"primary",cell:item=><>
      <strong>{item.name}</strong><p className="text-xs text-muted-foreground">{item.kind} · Round {item.sequence}</p></>},
    {key:"time",header:"Time",mobilePriority:"secondary",cell:item=>driveRoundTime(item.scheduledAt,item.timezone)},
    {key:"venue",header:"Venue",mobilePriority:"secondary",cell:item=>item.venue??"Not recorded"},
    {key:"mode",header:"Mode",mobilePriority:"secondary",cell:item=>item.mode??"Not recorded"},
    {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="COMPLETED"?"success":item.status==="SCHEDULED"?"info":item.status==="CANCELLED"?"error":"warning"}>{item.status}</StatusBadge>},
    {key:"slots",header:"Candidate slots",mobilePriority:"secondary",cell:()=> "See candidate interviews above"},
  ];
  return <div className="min-w-0 space-y-5">
    
    <PageHeader title={"Interviews · "+(data?.job.title??"Drive schedule")}
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<PageBackLink href={"/admin/placements/jobs/"+encodeURIComponent(jobId)} label="Drive overview" />} />
    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      {query.applicationId?<Input type="hidden" name="applicationId" value={query.applicationId}/>:null}
      <label className="grid gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round kind
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
      <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
    </form>
    <div className="flex min-w-0 flex-wrap gap-3 print:hidden">
      <Link href={"/admin/placements/jobs/"+encodeURIComponent(jobId)+"/schedule"}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        Clear filters
      </Link>
      <Link href={refreshHref}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
        Refresh interviews
      </Link>
    </div>
    <section aria-label="Candidate interviews" className="min-w-0 space-y-3">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Candidate interviews</h2>
      {appointments ? <>
        {appointments.candidateTotal>appointments.candidates.length?<Banner tone="warning">
          Showing {appointments.candidates.length} of {appointments.candidateTotal} shortlisted candidates in the scheduling selector. Deep-link from the application detail to include an individual learner.
        </Banner>:null}
        <p role="status" className="text-sm text-body">{appointments.appointmentTotal} matching candidate appointments · page {appointments.appointmentPage} of {appointments.appointmentPages}</p>
        <CollegeInterviewAppointments jobId={jobId}
          rounds={appointments.rounds} candidates={appointments.candidates}
          appointments={appointments.interviews} preferredApplicationId={query.applicationId}/>
        <nav aria-label="Candidate interview appointment pages" className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
          {appointments.appointmentPage>1?<Link href={adminInterviewsHref(jobId,{...query,appointmentPage:appointments.appointmentPage-1})}
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Previous appointments</Link>:null}
          {appointments.appointmentPage<appointments.appointmentPages?<Link href={adminInterviewsHref(jobId,{...query,appointmentPage:appointments.appointmentPage+1})}
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
