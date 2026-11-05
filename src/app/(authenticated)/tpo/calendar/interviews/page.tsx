import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import {TpoInterviewRescheduleForm} from "@/components/placements/tpo-interview-reschedule-form";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoInterviewReadiness} from "@/modules/placements/tpo-interview-readiness-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateTimeFormatter } from "@/lib/format-date";
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
   description="Pending and scheduled round-level interviews. Candidate-specific slots are not recorded here." actions={<TextLink href="/tpo/calendar" className="inline-flex min-h-11 items-center text-sm md:min-h-9">← Calendar</TextLink>}/>
  <form action="/tpo/calendar/interviews" method="get"
    className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" aria-label="Filter interviews">
   <Label className="min-w-0">Search company, drive or round
    <Input name="q" type="search" maxLength={100} defaultValue={data.q}
     className="mt-[6px] block min-h-11 md:min-h-9 w-full" />
   </Label>
   <Label>Lookahead
    <Select name="days" defaultValue={String(data.days)} className="mt-[6px] block min-h-11 md:min-h-9 w-full">
      {[7,14,30,60,90].map(n=><option key={n} value={n}>{n} days</option>)}
    </Select></Label>
   <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Apply</Button>
  </form>
  <section aria-label="Interview readiness counts" className="grid grid-cols-1 gap-3 md:grid-cols-3">
   {Object.entries(data.counts).map(([key,n])=><StatTile key={key} {...(tpoTileStyles["tile"] !== undefined ? {className:tpoTileStyles["tile"]} : {})}
    label={key.replaceAll(/([A-Z])/g," $1")} value={n} />)}
  </section>
  <p role="status" className="text-sm text-body leading-[1.6]">Interview rounds page {data.page}: {data.rows.length} actionable results. Pages are drawn from the persisted round book.</p>
  {data.rows.length===0?<EmptyState title="No interview rounds in this view" description="No persisted pending or relevant scheduled interview rounds were found." action={<TextLink href="/tpo/calendar/interviews" className="md:min-h-9 inline-flex min-h-11 items-center">Apply</TextLink>}/>:
   <section aria-label="Interview rounds" className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
   {data.rows.map(r=><article key={r.id} className="min-w-0 space-y-2 py-4">
    <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">{r.companyName} · {r.jobTitle}</Heading>
    <p className="mt-1 text-sm text-body leading-[22px]">{r.name} · {r.state.replaceAll("_"," ")} · {r.mode??"Mode not recorded"}</p>
    <p className="mt-1 text-sm text-body leading-[22px]">{r.scheduledAt?istDateTimeFormatter.format(new Date(r.scheduledAt)) + " IST":"Start not scheduled"} · {r.venue??"Venue not recorded"}</p>
    <p className="mt-1 text-xs text-[var(--lms-muted-text)] leading-5">Duration: {r.durationMinutes??"Not recorded"} minutes</p>
    <TextLink href={"/tpo/placements/jobs/"+r.jobId+"/candidate-schedule"} className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-sm">
      View round and candidate readiness →
    </TextLink>
    {r.status==="SCHEDULED"&&r.updatedAt?
      <TpoInterviewRescheduleForm round={{id:r.id,updatedAt:r.updatedAt,
       scheduledAt:r.scheduledAt,mode:r.mode,venue:r.venue,meetingUrl:r.meetingUrl??null}}/>:null}
   </article>)}</section>}
  {(data.page>1||data.limited)?<nav aria-label="Interview round pages" className="flex flex-wrap gap-3">
   {data.page>1?<ButtonLink variant="secondary" href={href(data.page-1)}>Previous 200</ButtonLink>:null}
   {data.limited?<ButtonLink variant="secondary" href={href(data.page+1)}>Next 200</ButtonLink>:null}
  </nav>:null}
  <p className="text-xs text-[var(--lms-muted-text)] leading-5">No interviewer identities, per-candidate slots or calendar invitations are invented from the round schedule.</p>
 </div>;
}
