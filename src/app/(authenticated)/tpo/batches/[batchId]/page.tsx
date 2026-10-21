import { StackedMetricBar } from "@/components/ui/stacked-metric-bar";
import batchStyles from "@/components/tpo/legacy-batch-eligibility.module.css";
import Link from "next/link";
import {tpoBatchReturnHref} from "@/modules/placements/tpo-batch-return-model";
import { redirect } from "next/navigation";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import {TpoBatchLifecycleControl} from "@/components/tpo/tpo-batch-lifecycle-control";
import {TpoBatchInvitationControl} from "@/components/tpo/tpo-batch-invitation-control";
import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
import {actionableBatchHistory} from "@/modules/placements/tpo-batch-history-undo-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatch, listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
import { getTpoBatchEligibilitySummary } from "@/modules/placements/tpo-batch-eligibility-summary-service";
import {getTpoBatchRegistrationSummary} from "@/modules/placements/tpo-batch-registration-summary-service";
import {getTpoBatchInvitationPreview} from "@/modules/placements/tpo-batch-invitation-service";
import {indianCalendarDate} from "@/modules/placements/tpo-batch-notification-model";
import {tpoBatchPlacementState} from "@/modules/placements/tpo-batch-state-label-model";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {projectTpoBatchNextStep} from "@/modules/placements/tpo-batch-next-step-state-model";
import {getTpoBatchOwnDecisionSummary} from "@/modules/placements/tpo-batch-own-decision-service";
export const dynamic="force-dynamic";
export default async function BatchPage({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {batchId}=await params;
 const query=await searchParams;
 const rawTab=query.tab;
 const backHref=tpoBatchReturnHref(query.returnTo);
 const selected=Array.isArray(rawTab)?rawTab[0]:rawTab;
 const aliases:Record<string,string>={classes:"classes",registration:"registrations",students:"students",registrations:"registrations",rules:"rules",history:"history"};
 if(selected && aliases[selected]){
  const preserved=new URLSearchParams();
  for(const key of ["page","q","classId","decision","source","registration","order","returnTo"]){
   const value=query[key];
   if(typeof value==="string"&&value.length<=200&&/^[a-zA-Z0-9_\-/.?=&]+$/.test(value))
    preserved.set(key,value);
  }
  const destination="/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected];
  redirect(destination+(preserved.size?"?"+preserved.toString():""));
 }
 const context=await getCurrentRequestContext();
 const [{batch,lifecycle,ready,decision},eligibility,history,registrations,invitePreview]=await Promise.all([getTpoBatch(context,batchId),getTpoBatchEligibilitySummary(context,batchId),listTpoBatchHistory(context,batchId),getTpoBatchRegistrationSummary(context,batchId),getTpoBatchInvitationPreview(context,batchId)]);
 const undoable=actionableBatchHistory(history.events).find(event=>event.canRequestUndo);
 const summary=eligibility.summary;
 const own=await getTpoBatchOwnDecisionSummary(context,batchId).catch(()=>null);
 const next=projectTpoBatchNextStep({finished:Boolean(lifecycle?.finishedAt),activeLearners:registrations.activeLearners,
   eligible:summary.complete?summary.eligible:null,undecided:summary.complete?summary.undecided:null,
   invited:Boolean(lifecycle?.invitedAt),deadline:lifecycle?.registrationDeadline??null,
   invitable:invitePreview.invitable,registered:registrations.registered},new Date());
 return <div className="min-w-0 space-y-4">
  <Link href={backHref} className="lms-inline-link inline-flex min-h-11 items-center gap-2 justify-start text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
   <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4"><path d="M13 8H3m5-5L3 8l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
   Placement eligibility
  </Link>
  <PageHeader title={batch.name} description={batch.program+" · "+batch.department+(batch.startYear?" · "+batch.startYear+(batch.endYear?"–"+batch.endYear:""):"")}/>
  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
   <Badge tone={Boolean(lifecycle?.finishedAt)?"neutral":summary.complete&&summary.eligible>0?"success":"info"} role="status">
    {ready?tpoBatchPlacementState({finishedAt:lifecycle?.finishedAt??null,
     eligible:summary.complete?summary.eligible:null}):"Status unavailable"}
   </Badge>
   <div className="flex min-w-0 flex-wrap items-start gap-3 print:hidden">
    {undoable?<details className="min-w-0 max-w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3">
     <summary title={"Undo the last "+String(undoable.after??"eligibility")+" decision. New decisions can prevent undo."}
      className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-link md:min-h-9">
      <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 16 16"><path d="M2.5 4.5H8a5 5 0 1 1-4.5 7.2M2.5 4.5V1m0 3.5H6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Undo last decision
     </summary>
     <div className="w-[min(460px,85vw)] max-w-full pb-3">
      <p className="text-xs text-muted-foreground">The server checks for any intervening decision.</p>
      <TpoBatchUndoControl batchId={batchId} actionId={undoable.actionId}/>
     </div>
    </details>:null}
    {ready?<details className="min-w-0 max-w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3">
     <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-link md:min-h-9">
      {lifecycle?.finishedAt?"Reopen batch":"Mark finished"}
     </summary>
     <div className="w-[min(460px,85vw)] max-w-full pb-3">
      <TpoBatchLifecycleControl batchId={batchId} state={lifecycle?{
       invitedAt:lifecycle.invitedAt?.toISOString()??null,finishedAt:lifecycle.finishedAt?.toISOString()??null,
       expectedVersion:lifecycle.updatedAt.toISOString(),
      }:null}/>
     </div>
    </details>:null}
   </div>
  </div>
  <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
 <section id="batch-next-step" aria-label="Next step" tabIndex={-1}
  className="scroll-mt-24 space-y-3 border-b border-[var(--lms-canvas-border)] py-4 target:animate-pulse">
  <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">Next step</h2>
  <h3 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">{next.title}</h3>
  <p className="text-sm text-body leading-[22px]">{next.detail}</p>
  <div className="flex flex-wrap gap-3">
   <Link href={"/tpo/batches/"+batchId+next.href}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
    {next.button} →
   </Link>
   {registrations.available&&(registrations.registered??0)>0?<Link href={"/tpo/batches/"+batchId+"/students"}
    className="inline-flex min-h-11 items-center text-sm font-semibold text-link lms-inline-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
    {registrations.registered} students registered: continue on Students →
   </Link>:null}
  </div>
 </section>
 <section aria-label="Batch eligibility snapshot" className="min-w-0 space-y-3 border-b border-border py-4">
  <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">Eligibility decisions</h2>
  <p className="text-sm text-muted-foreground leading-[22px]">{summary.complete?
   "Inherited learner, class and batch decisions for the active roster.":
   "Partial snapshot: only the first "+eligibility.limit+" learners were assessed. Do not treat these counts as batch totals."}</p>
  <dl className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden border-y border-[var(--lms-canvas-border)] md:grid-cols-4">
   {[
    ["Eligible",summary.eligible],["Ineligible",summary.ineligible],
    ["Not decided",summary.undecided],["Needs review",summary.needsReview],
   ].map(([label,value])=><div key={label} className="min-w-0 border-b border-r border-[var(--lms-canvas-border)] px-3 py-3 text-sm [overflow-wrap:anywhere] last:border-r-0 md:border-b-0">
    <dt>{label}</dt><dd className="font-semibold tabular-nums">{value}</dd>
   </div>)}
  </dl>
  {summary.complete&&summary.assessed>0?
   <StackedMetricBar className={batchStyles.bar} maximum={summary.assessed}
    label={summary.eligible+" eligible, "+summary.ineligible+" ineligible, "+summary.undecided+" not decided, "+summary.needsReview+" need review"}
    segments={[{label:"Eligible",value:summary.eligible,tone:"success"},
      {label:"Ineligible",value:summary.ineligible,tone:"error"},
      {label:"Not decided",value:summary.undecided,tone:"primary"}]} />:null}
  <p className="text-sm leading-[22px]">Next step: {eligibility.nextAction==="REVIEW"?"Review incomplete or ambiguous decisions":
    eligibility.nextAction==="DECIDE"?"Decide undecided learners":
    eligibility.nextAction==="INVITE"?"Review batch invitation readiness":"Review finished batch"}</p>
  <Link href={"/tpo/batches/"+batchId+"/students"} className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open Students</Link>
 </section>
  </div>
  <TpoBatchWorkspaceTabs batchId={batchId} active="" students={registrations.activeLearners} />

 {ready&&summary.complete&&summary.undecided>0?<p data-testid="batch.suggest" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-body leading-[22px]">
  Suggested: make them eligible <Link href={"/tpo/batches/"+batchId+"/students?decision=NOT_DECIDED"}
   className="lms-inline-link ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" data-testid="batch.suggest-do">Do it</Link>
  </p>:ready&&!lifecycle?.invitedAt&&invitePreview.invitable>0?<p data-testid="batch.suggest"
   className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-body leading-[22px]">
   Suggested: invite the batch (Next step, above) <Link href="#batch-next-step"
    className="lms-inline-link ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" data-testid="batch.suggest-do">Show me</Link>
  </p>:ready&&next.button==="Remind or move deadline"?<p data-testid="batch.suggest" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-body leading-[22px]">
   Suggested: remind them to register <Link href="#batch-reminder" className="lms-inline-link ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" data-testid="batch.suggest-do">Show me</Link>
  </p>:null}
 {own?<Link data-testid="batch.act" href={"/tpo/batches/"+batchId+"/students?source=LEARNER"}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link lms-inline-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
   {own.total} {own.total===1?"student is":"students are"} decided individually
   {own.uncertain>0?", "+own.uncertain+" need class review":own.different===0?", all the same as their class or batch":", "+own.different+" differ from their class or batch"} →
  </Link>:<p role="status" className="text-sm text-body leading-[22px]">Individual decision counts are unavailable. Review learner decisions on Students.</p>}
 <section aria-label="Whole batch eligibility decision" className="space-y-2 border-b border-border py-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-7">Whole batch</h2>
      <p className="text-sm text-body leading-[22px]">Decision: <strong>{decision.status.replaceAll("_"," ")}</strong></p>
      {decision.reason?<p className="text-xs text-muted-foreground leading-5">Reason: {decision.reason}</p>:null}
    </div>
    <Link href={"/tpo/batches/"+batchId+"/rules"} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link lms-inline-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
      {lifecycle?.finishedAt?"Review batch decision":"Set batch decision"} →
    </Link>
  </div>
  {decision.status==="INELIGIBLE"?<p className="text-sm text-warning leading-[22px]">The batch is ineligible: {decision.reason??"No reason recorded"}. Classes or students set to Eligible are still in placements.</p>:null}
 </section>

 {ready && registrations.available ? <section id="batch-invite" aria-label="Invite learners to register"><TpoBatchInvitationControl
  batchId={batchId} invitedAt={lifecycle?.invitedAt?.toISOString() ?? null}
  finishedAt={lifecycle?.finishedAt?.toISOString() ?? null}
  deadline={lifecycle?.registrationDeadline?.toISOString() ?? null}
  expectedVersion={lifecycle?.updatedAt.toISOString() ?? "none"}
  invitable={invitePreview.invitable} eligible={invitePreview.eligible}
  deadlinePassed={registrations.invitation.stage === "DEADLINE_PASSED"}
  minDate={indianCalendarDate(new Date())} /></section> : null}







 <p className="text-sm text-muted-foreground leading-[22px]">Choose Students for eligibility, Registrations for recorded choices, Rules for policy, or History for decisions and exact undo.</p>
 </div>;
}
