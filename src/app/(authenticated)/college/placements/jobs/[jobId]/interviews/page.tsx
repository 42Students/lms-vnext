import Link from "next/link";
import {AuthorizationError} from "@/modules/permissions/policy";
import {StatTile} from "@/components/ui/stat-tile";
import {Alert} from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { driveInterviewsHref, driveInterviewsParams, driveRoundTime } from "@/modules/placements/college-drive-interviews-model";
import { listCollegeDriveInterviews } from "@/modules/placements/college-drive-interviews-service";
import { getCollegeRoundSlotAppointments } from "@/modules/placements/college-round-slot-action-service";
import { CollegeInterviewAppointments } from "@/components/placements/college-interview-appointments";
import {Select} from "@/components/ui/select";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {Button} from "@/components/ui/button";

export default async function CollegeDriveInterviewsPage({params,searchParams}:{
  params:Promise<{jobId:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context=await getCurrentRequestContext();
  if(!context.membership)return <div className="min-w-0 space-y-4">
    <PageHeader title="Interviews"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator for a College Admin assignment before viewing interviews."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
  </div>;
  const {jobId}=await params;
  const query=driveInterviewsParams(await searchParams);
  if(!query) return <ErrorState title="Invalid interview filters"
    description="Round kind, status or page is invalid. No records were loaded." action={<Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/interviews`} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Clear filters</Link>}/>;
  const [roundResult,appointmentResult]=await Promise.allSettled([
    listCollegeDriveInterviews(context,jobId,query),
    getCollegeRoundSlotAppointments(context,jobId),
  ]);
  if(roundResult.status==="rejected"&&roundResult.reason instanceof AuthorizationError)
    throw roundResult.reason;
  if(appointmentResult.status==="rejected"&&appointmentResult.reason instanceof AuthorizationError)
    throw appointmentResult.reason;
  const data=roundResult.status==="fulfilled"?roundResult.value:null;
  const appointments=appointmentResult.status==="fulfilled"?appointmentResult.value:null;
  const items=data?.items??[];
  const scheduled=appointments?.interviews.filter(row=>row.status==="SCHEDULED")??[];
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const todayCount=scheduled.filter(row=>new Intl.DateTimeFormat("sv-SE",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).format(new Date(row.scheduledAt))===today).length;
  const columns:DataTableColumn<(typeof items)[number]>[]=[
    {key:"round",header:"Round",mobilePriority:"primary",cell:item=><div>
      <p className="font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground leading-5">{item.kind} · Round {item.sequence}</p>
    </div>},
    {key:"time",header:"Time",cell:item=>driveRoundTime(item.scheduledAt,item.timezone)},
    {key:"venue",header:"Venue",cell:item=>item.venue??"Not recorded"},
    {key:"mode",header:"Mode",cell:item=>item.mode??"Not recorded"},
    {key:"status",header:"Status",cell:item=><StatusBadge tone={item.status==="COMPLETED"?"success":item.status==="CANCELLED"?"error":"info"}>{item.status}</StatusBadge>},
  ];
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Interviews"
      description={(data?.job.title??appointments?.job.title??"Drive schedule")+" · Candidate interviews, completed and no-show outcomes."}
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline min-h-11 md:min-h-9 inline-flex items-center hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Drive overview</Link>} />
    <div className="flex min-w-0 flex-wrap gap-3 text-sm">
      <span className="rounded-full border border-[var(--lms-canvas-border)] px-3 py-1">This drive only</span>
      <Link href={driveInterviewsHref(jobId,query)} className="font-semibold text-link underline">Refresh</Link>
    </div>
    <section aria-label="Interview schedule summary" className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="Scheduled" value={appointments?scheduled.length:"Not available"}/>
      <StatTile label="Today" value={appointments?todayCount:"Not available"}/>
      <StatTile label="Companies" value="Not verified" detail="The schedule does not return company totals."/>
      <StatTile label="Conflicts" value="Not verified" detail="Candidate/room conflict counts are not provided by this view."/>
    </section>
    {!appointments?<Alert tone="warning">Could not load interviews. Retry to view candidate appointments. No appointment data was fabricated.</Alert>:null}
    {!data?<Alert tone="warning">Could not load interview rounds. Existing candidate appointments remain available below.</Alert>:null}
    {(!data||!appointments)?<Link href={driveInterviewsHref(jobId,query)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>:null}
    {appointments?<CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={appointments.interviews}
      preferredApplicationId={query.applicationId}/>:null}
    <form method="get" role="search" aria-label="Interview round filters" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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
    <section aria-label="Persisted interview rounds" className="space-y-2">
      <p role="status" className="text-sm text-body leading-[22px]">{data?.total??"Unavailable"} matching interview/GD rounds</p>
      <DataTable caption="Persisted interview rounds" columns={columns} rows={items}
        getRowKey={item=>item.id} empty={<EmptyState title="No matching interview rounds" description={data?.total===0?"No interviews match your filters. Try adjusting filters or schedule interviews from the Jobs module.":"No rows on this page; select an earlier page."} action={<Link href={data?.total===0?driveInterviewsHref(jobId,{...query,kind:"ALL",status:"ALL",page:1}):driveInterviewsHref(jobId,{...query,page:Math.max(1,query.page-1)})} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">{data?.total===0?"Clear filters":"Previous page"}</Link>}/>} />
    </section>
    <nav aria-label="Interview round pages" className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-border pt-[var(--lms-space-3)] text-sm text-body sm:flex-row sm:items-center">
      <span>Page {query.page} of {data?.totalPages??"unavailable"}</span><div className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&_a]:flex-1 max-[767px]:[&_a]:justify-center">
        {query.page>1?<Link href={driveInterviewsHref(jobId,{...query,page:query.page-1})} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous</Link>:null}
        {data&&query.page<data.totalPages?<Link href={driveInterviewsHref(jobId,{...query,page:query.page+1})} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground leading-5">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
