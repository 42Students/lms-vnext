import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
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
  if(!context.adminScope?.collegeId) redirect("/admin/placements");
  const {jobId}=await params;
  const query=driveInterviewsParams(await searchParams);
  if(!query) return <ErrorState title="Invalid interview filters"
    description="Round kind, status or page is invalid. No records were loaded." />;
  const [data,appointments]=await Promise.all([
    listCollegeDriveInterviews(context,jobId,query),
    getCollegeRoundSlotAppointments(context,jobId),
  ]);
  return <div className="space-y-6">
    <PageHeader eyebrow="Super Admin · Placements" title={"Interviews · "+data.job.title}
      description="Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds."
      actions={<Link href={`/admin/placements/jobs/${jobId}`} className="text-primary-text underline">Drive overview</Link>} />
    <form method="get" className="flex flex-wrap items-end gap-4 rounded-xl border border-border p-4">
      <label className="grid gap-1 text-sm">Round kind
        <select name="kind" defaultValue={query.kind} className="min-h-10 rounded-md border border-border px-2">
          <option value="ALL">Interview and GD</option><option value="INTERVIEW">Interview</option><option value="GD">GD</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">Status
        <select name="status" defaultValue={query.status} className="min-h-10 rounded-md border border-border px-2">
          {["ALL","PENDING","SCHEDULED","COMPLETED","CANCELLED"].map(status=>
            <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-10 rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
    </form>
    <CollegeInterviewAppointments jobId={jobId} rounds={appointments.rounds}
      candidates={appointments.candidates} appointments={appointments.interviews}
      preferredApplicationId={query.applicationId}/>
    <section aria-label="Persisted interview rounds" className="overflow-x-auto rounded-xl border border-border">
      <p className="p-3 text-sm text-muted-foreground">{data.total} matching interview/GD rounds</p>
      {data.items.length?<table className="w-full min-w-[48rem] text-left text-sm">
        <thead><tr className="border-y border-border bg-muted">
          <th className="p-3">Round</th><th className="p-3">Time</th><th className="p-3">Venue</th>
          <th className="p-3">Mode</th><th className="p-3">Status</th><th className="p-3">Candidate slots</th>
        </tr></thead>
        <tbody>{data.items.map(item=><tr key={item.id} className="border-b border-border">
          <td className="p-3"><p className="font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.kind} · Round {item.sequence}</p></td>
          <td className="p-3">{driveRoundTime(item.scheduledAt,item.timezone)}</td>
          <td className="p-3">{item.venue ?? "Not recorded"}</td>
          <td className="p-3">{item.mode ?? "Not recorded"}</td>
          <td className="p-3">{item.status}</td>
          <td className="p-3">See candidate interviews above</td>
        </tr>)}</tbody>
      </table>:<p className="p-6 text-sm text-body">
        {data.total===0?"No persisted interview or GD rounds match these filters.":"No rows on this page; select an earlier page."}
      </p>}
    </section>
    <nav aria-label="Interview round pages" className="flex justify-between gap-3 text-sm">
      <span>Page {query.page} of {data.totalPages}</span><div className="flex gap-3">
        {query.page>1?<Link href={adminInterviewsHref(jobId,{...query,page:query.page-1})}>Previous</Link>:null}
        {query.page<data.totalPages?<Link href={adminInterviewsHref(jobId,{...query,page:query.page+1})}>Next</Link>:null}
      </div>
    </nav>
    <p className="text-xs text-muted-foreground">
      Interview appointments use the registered candidate-slot schedule. Confirmed outcomes are stored as immutable audit events.
    </p>
  </div>;
}
