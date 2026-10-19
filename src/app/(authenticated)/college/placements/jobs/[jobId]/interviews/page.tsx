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
    {key:"status",header:"Status",cell:item=>item.status},
    {key:"slots",header:"Candidate slots",cell:()=>"See candidate interviews above"},
  ];
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title={"Interviews · "+data.job.title}
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<Link href={`/college/placements/jobs/${jobId}/overview`} className="text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[var(--lms-control-height)] inline-flex items-center">Drive overview</Link>} />
    <form method="get" role="search" aria-label="Interview round filters" className="flex flex-wrap items-end gap-4 rounded-[8px] border border-border p-4">
      <label className="grid gap-1 text-sm">Round kind
        <select name="kind" defaultValue={query.kind} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">Status
        <select name="status" defaultValue={query.status} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border px-2 text-base sm:text-sm">
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] bg-primary px-4 font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary inline-flex items-center">Filter</button>
    </form>
    <CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={appointments.interviews}
      preferredApplicationId={query.applicationId}/>
    <section aria-label="Persisted interview rounds" className="space-y-2">
      <p role="status" className="text-sm text-body">{data.total} matching interview/GD rounds</p>
      <DataTable caption="Persisted interview rounds" columns={columns} rows={data.items}
        getRowKey={item=>item.id} empty={<p role="status" className="text-sm text-body">
          {data.total===0?"No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."}
        </p>} />
    </section>
    <nav aria-label="Interview round pages" className="flex justify-between gap-3 text-sm">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex gap-3">
        {query.page>1?<Link href={driveInterviewsHref(jobId,{...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link href={driveInterviewsHref(jobId,{...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
