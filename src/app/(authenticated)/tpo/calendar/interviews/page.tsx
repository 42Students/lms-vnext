import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {TpoInterviewRescheduleForm} from "@/components/placements/tpo-interview-reschedule-form";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoInterviewReadiness} from "@/modules/placements/tpo-interview-readiness-service";
type Props={searchParams:Promise<{days?:string|string[];page?:string|string[];q?:string|string[]}>};
export default async function TpoInterviewReadinessPage({searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const query=await searchParams;const days=Array.isArray(query.days)?query.days[0]:query.days;
 const first=(x:string|string[]|undefined)=>Array.isArray(x)?x[0]:x;
 const data=await getTpoInterviewReadiness(context,{days:days||14,page:first(query.page)||1,q:first(query.q)||""});
 const href=(page:number)=>"/tpo/calendar/interviews?"+new URLSearchParams({days:String(data.days),page:String(page),...(data.q?{q:data.q}:{})}).toString();
 return <div className="space-y-6">
  <PageHeader eyebrow="TPO · Interview rounds" title="Interview schedule readiness"
   description="Pending and scheduled round-level interviews. Candidate-specific slots are not recorded here."/>
  <Link href="/tpo/calendar" className="text-sm font-semibold text-link hover:underline lms-inline-link">← Calendar</Link>
  <form action="/tpo/calendar/interviews" method="get"
    className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
   <label className="text-sm font-semibold text-body">Search company, drive or round
    <Input name="q" type="search" maxLength={100} defaultValue={data.q}
     className="mt-2 block min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" />
   </label>
   <label className="text-sm font-semibold text-body">Lookahead
    <Select name="days" defaultValue={String(data.days)} className="mt-2 block min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
      {[7,14,30,60,90].map(n=><option key={n} value={n}>{n} days</option>)}
    </Select></label>
   <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-white">Apply</Button>
  </form>
  <section aria-label="Interview readiness counts" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
   {Object.entries(data.counts).map(([key,n])=><div key={key} className="py-4">
    <p className="text-xs text-body">{key.replaceAll(/([A-Z])/g," $1")}</p>
    <p className="text-xl font-semibold tabular-nums text-foreground">{n}</p>
   </div>)}
  </section>
  <p role="status" className="text-sm text-body">Interview rounds page {data.page}: {data.rows.length} actionable results. Pages are drawn from the persisted round book.</p>
  <nav aria-label="Interview round pages" className="flex flex-wrap gap-3">
   {data.page>1?<Link href={href(data.page-1)} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-link lms-inline-link">Previous 200</Link>:null}
   {data.limited?<Link href={href(data.page+1)} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-link lms-inline-link">Next 200</Link>:null}
  </nav>
  {data.rows.length===0?<EmptyState title="No interview rounds in this view" description="No persisted pending or relevant scheduled interview rounds were found."/>:
   <section aria-label="Interview rounds" className="divide-y divide-border border-y border-border">
   {data.rows.map(r=><article key={r.id} className="py-4">
    <h2 className="font-semibold text-foreground">{r.companyName} · {r.jobTitle}</h2>
    <p className="mt-1 text-sm text-body">{r.name} · {r.state.replaceAll("_"," ")} · {r.mode??"Mode not recorded"}</p>
    <p className="mt-1 text-sm text-body">{r.scheduledAt?new Date(r.scheduledAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}):"Start not scheduled"} IST · {r.venue??"Venue not recorded"}</p>
    <p className="mt-1 text-xs text-body">Duration: {r.durationMinutes??"Not recorded"} minutes</p>
    <Link href={"/tpo/placements/jobs/"+r.jobId+"/candidate-schedule"} className="mt-2 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-link hover:underline lms-inline-link">
      View round and candidate readiness →
    </Link>
    {r.status==="SCHEDULED"&&r.updatedAt?
      <TpoInterviewRescheduleForm round={{id:r.id,updatedAt:r.updatedAt,
       scheduledAt:r.scheduledAt,mode:r.mode,venue:r.venue,meetingUrl:r.meetingUrl??null}}/>:null}
   </article>)}</section>}
  <p className="text-xs text-body">No interviewer identities, per-candidate slots or calendar invitations are invented from the round schedule.</p>
 </div>;
}
