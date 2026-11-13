import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import {EmptyState} from "@/components/ui/empty-state";
import {Disclosure} from "@/components/ui/disclosure";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoJoiningFollowups} from "@/modules/placements/tpo-joining-followup-service";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ROLE } from "@/modules/identity/roles";
type Search={seasonId?:string|string[];state?:string|string[]};
function first(v:string|string[]|undefined){return Array.isArray(v)?v[0]:v;}
export default async function TpoJoiningFollowupsPage({searchParams}:{searchParams:Promise<Search>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,ROLE.TPO))redirect("/dashboard");
 const query=await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/joining-followups"/>;
 const report=await getTpoJoiningFollowups(context,{
  ...(first(query.seasonId)?{seasonId:first(query.seasonId)}:{}),
  ...(first(query.state)?{state:first(query.state)}:{}),
 });
 const params=new URLSearchParams();
 if(report.season)params.set("seasonId",report.season.id);
 params.set("state",report.state);
 return <div data-tpo-presentation-report className="min-w-0 space-y-4">
  <PageHeader title="Joining follow-ups"
   description="Accepted-offer joining evidence, pending confirmations and deferred dates."
   actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
     <TextLink href="/tpo/reports/joining-status" className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">← Joining outcomes</TextLink>
     {report.season?<ButtonLink variant="primary" href={"/api/placements/reports/joining-followups?"+params.toString()}
    className="w-full sm:w-auto">
    Export CSV</ButtonLink>:null}
   </div>}/>
  <form action="/tpo/reports/joining-followups" method="get"
   className="grid min-w-0 gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
    <Label className="min-w-0">Season
     <Select name="seasonId" defaultValue={report.season?.id??""}
      className="mt-2 block min-h-11 sm:min-h-9 w-full">
      {report.seasons.length===0?<option value="">No season</option>:null}
      {report.seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
     </Select></Label>
    <Label className="min-w-0">Follow-up
     <Select name="state" defaultValue={report.state}
      className="mt-2 block min-h-11 sm:min-h-9 w-full">
      <option value="ALL">All open</option><option value="PENDING">Pending</option>
      <option value="DEFERRED">Deferred</option><option value="DATE_DUE">Dated and due</option>
      <option value="DATE_MISSING">Missing joining date</option>
      <option value="UPCOMING_7_DAYS">Joining next 7 days</option>
     </Select></Label>
    <Button type="submit" className="min-h-11 w-full sm:w-auto sm:min-h-9">Apply</Button>
  </form>
      <TpoReportPresentation />
      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/joining-followups" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
  {!report.season?<EmptyState title="No placement season"
    description="Joining follow-ups require a recorded placement season. No joining outcomes are inferred."
    action={<ButtonLink variant="secondary" href="/tpo/settings/season">Review placement seasons</ButtonLink>}/>:<>
   <section className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Joining evidence">{Object.entries(report.counts).map(([label,n])=><StatTile key={label} label={label.replaceAll(/([A-Z])/g," $1").trim()} value={n} className="min-h-[104px]" />)}</section>
   <Disclosure title="Joining date methodology" className="border-y border-border py-3"><p className="pt-3 text-sm text-body leading-[22px]">
    Due means a persisted joining date on or before {report.todayIst} IST. Upcoming means a recorded calendar date strictly after today and within seven IST calendar days. No date is unknown, never late.
    Only ACCEPTED offers count; JOINED requires an explicit recorded outcome.
   </p></Disclosure>
   {report.truncated?<Alert tone="warning">First 500 accepted offers examined; counts may be incomplete.</Alert>:null}
   {!report.rows.length?<EmptyState title="No matching joining follow-ups"
    description={report.state === "ALL"
      ? "No open joining follow-ups were found for this season. Check recorded joining outcomes for completed or closed cases."
      : "No open joining follow-ups match this status. Try All open to widen the view."}
    action={<ButtonLink variant="secondary" href="/tpo/reports/joining-status">View joining outcomes</ButtonLink>}/>:
    <section className="grid gap-3" aria-label="Pending and deferred joining offers">
     {report.rows.map(o=><article key={o.offerId} className="min-w-0 border-b border-border py-4">
       <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">{o.companyName} · {o.roleTitle}</Heading>
       <p className="mt-1 text-sm text-body leading-[22px]">{o.candidateName??"Name not recorded"} · {o.jobTitle}</p>
       <p className="mt-1 text-sm text-body leading-[22px]">{o.joiningStatus??"PENDING"} · Joining date: {o.scheduledDate??"Not recorded"}</p>
       <TextLink href={"/tpo/placements/jobs/"+o.jobId+"/joining"}
         className="mt-2 inline-flex min-h-11 sm:min-h-9 items-center text-sm">
         Open drive joining records →</TextLink>
     </article>)}</section>}
  </>}
 </div>;
}
