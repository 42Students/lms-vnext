import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoJoiningFollowups} from "@/modules/placements/tpo-joining-followup-service";
type Search={seasonId?:string|string[];state?:string|string[]};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoJoiningFollowupsPage({searchParams}:{searchParams:Promise<Search>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const query=await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/joining-followups"/>;
 const report=await getTpoJoiningFollowups(context,{
  ...(first(query.seasonId)?{seasonId:first(query.seasonId)}:{}),
  ...(first(query.state)?{state:first(query.state)}:{}),
 });
 const params=new URLSearchParams();
 if(report.season)params.set("seasonId",report.season.id);
 params.set("state",report.state);
 return <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/joining-followups" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
  <PageHeader eyebrow="TPO · Joining" title="Joining follow-ups"
   description="Accepted-offer joining evidence, pending confirmations and deferred dates."
   actions={report.season?<a href={"/api/placements/reports/joining-followups?"+params.toString()}
    className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary">
    Export CSV</a>:null}/>
  <Link href="/tpo/reports/joining-status" className="text-sm font-semibold text-link hover:underline">← Joining outcomes</Link>
  <form action="/tpo/reports/joining-followups" method="get"
   className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
    <label className="min-w-40 flex-1 text-sm font-semibold text-body">Season
     <Select name="seasonId" defaultValue={report.season?.id??""}
      className="mt-2 block min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
      {report.seasons.length===0?<option value="">No season</option>:null}
      {report.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
     </Select></label>
    <label className="min-w-36 flex-1 text-sm font-semibold text-body">Follow-up
     <Select name="state" defaultValue={report.state}
      className="mt-2 block min-h-11 sm:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
      <option value="ALL">All open</option><option value="PENDING">Pending</option>
      <option value="DEFERRED">Deferred</option><option value="DATE_DUE">Dated and due</option>
      <option value="DATE_MISSING">Missing joining date</option>
      <option value="UPCOMING_7_DAYS">Joining next 7 days</option>
     </Select></label>
    <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 font-[650] text-on-primary">Apply</Button>
  </form>
  {!report.season?<EmptyState title="No placement season" description="Joining follow-ups require a persisted placement season."/>:<>
   <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Joining evidence">
    {Object.entries(report.counts).map(([label,n])=><div key={label}
     className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
     <p className="text-xs text-body">{label.replaceAll(/([A-Z])/g," $1")}</p>
     <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{n}</p>
    </div>)}
   </section>
   <p className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle p-4 text-sm text-body">
    Due means a persisted joining date on or before {report.todayIst} IST. Upcoming means a recorded calendar date strictly after today and within seven IST calendar days. No date is unknown, never late.
    Only ACCEPTED offers count; JOINED requires an explicit recorded outcome.
   </p>
   {report.truncated?<p role="status" className="text-sm text-body">First 500 accepted offers examined; counts may be incomplete.</p>:null}
   {!report.rows.length?<EmptyState title="No matching joining follow-ups"
    description="No accepted offers remain in the selected open state."/>:
    <section className="grid gap-3" aria-label="Pending and deferred joining offers">
     {report.rows.map(o=><article key={o.offerId} className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
       <h2 className="font-semibold text-foreground">{o.companyName} · {o.roleTitle}</h2>
       <p className="mt-1 text-sm text-body">{o.candidateName??"Name not recorded"} · {o.jobTitle}</p>
       <p className="mt-1 text-sm text-body">{o.joiningStatus??"PENDING"} · Joining date: {o.scheduledDate??"Not recorded"}</p>
       <Link href={"/tpo/placements/jobs/"+o.jobId+"/joining"}
         className="mt-2 inline-flex min-h-11 sm:min-h-9 items-center text-sm font-semibold text-link hover:underline">
         Open drive joining records →</Link>
     </article>)}</section>}
  </>}
 </div>;
}
