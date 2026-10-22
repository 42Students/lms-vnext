import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
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
 return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="TPO · Interview rounds" title="Interview schedule readiness"
   description="Pending and scheduled round-level interviews. Candidate-specific slots are not recorded here." actions={<Link href="/tpo/calendar" className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 lms-inline-link">← Calendar</Link>}/>
  <form action="/tpo/calendar/interviews" method="get"
    className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" aria-label="Filter interviews">
   <label className="min-w-0 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Search company, drive or round
    <Input name="q" type="search" maxLength={100} defaultValue={data.q}
     className="mt-[6px] block min-h-11 md:min-h-9 w-full" />
   </label>
   <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Lookahead
    <Select name="days" defaultValue={String(data.days)} className="mt-[6px] block min-h-11 md:min-h-9 w-full">
      {[7,14,30,60,90].map(n=><option key={n} value={n}>{n} days</option>)}
    </Select></label>
   <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Apply</Button>
  </form>
  <section aria-label="Interview readiness counts" className="grid grid-cols-1 gap-3 min-[768px]:grid-cols-3">
   {Object.entries(data.counts).map(([key,n])=><StatTile key={key} {...(tpoTileStyles["tile"] !== undefined ? {className:tpoTileStyles["tile"]} : {})}
    label={key.replaceAll(/([A-Z])/g," $1")} value={n} />)}
  </section>
  <p role="status" className="text-sm text-body leading-[1.6]">Interview rounds page {data.page}: {data.rows.length} actionable results. Pages are drawn from the persisted round book.</p>
  {data.rows.length===0?<EmptyState title="No interview rounds in this view" description="No persisted pending or relevant scheduled interview rounds were found." action={<Link href="/tpo/calendar/interviews" className="md:min-h-9 inline-flex min-h-11 items-center font-semibold text-link underline">Apply</Link>}/>:
   <section aria-label="Interview rounds" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
   {data.rows.map(r=><article key={r.id} className="min-w-0 space-y-2 py-4">
    <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">{r.companyName} · {r.jobTitle}</h2>
    <p className="mt-1 text-sm text-body leading-[22px]">{r.name} · {r.state.replaceAll("_"," ")} · {r.mode??"Mode not recorded"}</p>
    <p className="mt-1 text-sm text-body leading-[22px]">{r.scheduledAt?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(r.scheduledAt)) + " IST":"Start not scheduled"} · {r.venue??"Venue not recorded"}</p>
    <p className="mt-1 text-xs text-[var(--lms-muted-text)] leading-5">Duration: {r.durationMinutes??"Not recorded"} minutes</p>
    <Link href={"/tpo/placements/jobs/"+r.jobId+"/candidate-schedule"} className="mt-2 inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-link hover:underline lms-inline-link">
      View round and candidate readiness →
    </Link>
    {r.status==="SCHEDULED"&&r.updatedAt?
      <TpoInterviewRescheduleForm round={{id:r.id,updatedAt:r.updatedAt,
       scheduledAt:r.scheduledAt,mode:r.mode,venue:r.venue,meetingUrl:r.meetingUrl??null}}/>:null}
   </article>)}</section>}
  {(data.page>1||data.limited)?<nav aria-label="Interview round pages" className="flex flex-wrap gap-3">
   {data.page>1?<Link href={href(data.page-1)} className="min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-link lms-inline-link hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Previous 200</Link>:null}
   {data.limited?<Link href={href(data.page+1)} className="min-h-11 min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm text-link lms-inline-link hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Next 200</Link>:null}
  </nav>:null}
  <p className="text-xs text-[var(--lms-muted-text)] leading-5">No interviewer identities, per-candidate slots or calendar invitations are invented from the round schedule.</p>
 </div>;
}
