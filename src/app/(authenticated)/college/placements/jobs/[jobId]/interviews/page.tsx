import Link from "next/link";
import { redirect } from "next/navigation";
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
  if(!context.membership) redirect("/dashboard");
  const {jobId}=await params;
  const query=driveInterviewsParams(await searchParams);
  if(!query) return <ErrorState title="Invalid interview filters"
    description="Round kind, status or page is invalid. No records were loaded." />;
  const [data,appointments]=await Promise.all([
    listCollegeDriveInterviews(context,jobId,query),
    getCollegeRoundSlotAppointments(context,jobId),
  ]);
  const columns:DataTableColumn<(typeof data.items)[number]>[]=[
    {key:"round",header:"Round",mobilePriority:"primary",cell:item=><div>
      <p className="font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground">{item.kind} · Round {item.sequence}</p>
    </div>},
    {key:"time",header:"Time",cell:item=>driveRoundTime(item.scheduledAt,item.timezone)},
    {key:"venue",header:"Venue",cell:item=>item.venue??"Not recorded"},
    {key:"mode",header:"Mode",cell:item=>item.mode??"Not recorded"},
    {key:"status",header:"Status",cell:item=><StatusBadge tone={item.status==="COMPLETED"?"success":item.status==="CANCELLED"?"neutral":"info"}>{item.status}</StatusBadge>},
    {key:"slots",header:"Candidate slots",cell:()=>"See candidate interviews above"},
  ];
  return <div className="space-y-6">
    <PageHeader title={"Interviews · "+data.job.title}
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-11 md:min-h-9 inline-flex items-center">Drive overview</Link>} />
    <form method="get" role="search" aria-label="Interview round filters" className="flex flex-wrap items-end gap-3 border-b border-border pb-4 max-[767px]:flex-col max-[767px]:items-stretch">
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round kind
        <Select name="kind" defaultValue={query.kind} >
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </Select>
      </label>
      <label className="grid min-w-0 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={query.status} >
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </Select>
      </label>
      <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
    </form>
    <CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={appointments.interviews}
      preferredApplicationId={query.applicationId}/>
    <section aria-label="Persisted interview rounds" className="space-y-2">
      <p role="status" className="text-sm text-body">{data.total} matching interview/GD rounds</p>
      <DataTable caption="Persisted interview rounds" columns={columns} rows={data.items}
        getRowKey={item=>item.id} empty={<EmptyState title="No matching interview rounds" description={data.total===0?"No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."}/>} />
    </section>
    <nav aria-label="Interview round pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-body">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex flex-wrap gap-3">
        {query.page>1?<Link href={driveInterviewsHref(jobId,{...query,page:query.page-1})} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Previous</Link>:null}
        {query.page<data.totalPages?<Link href={driveInterviewsHref(jobId,{...query,page:query.page+1})} className="inline-flex min-h-11 items-center font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
