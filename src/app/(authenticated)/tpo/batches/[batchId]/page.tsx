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
import {projectTpoBatchNextStep} from "@/modules/placements/tpo-batch-next-step-state-model";
import {getTpoBatchOwnDecisionSummary} from "@/modules/placements/tpo-batch-own-decision-service";
export const dynamic="force-dynamic";
export default async function BatchPage({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{tab?:string|string[];returnTo?:string|string[]}>}){
 const {batchId}=await params;
 const query=await searchParams;
 const rawTab=query.tab;
 const backHref=tpoBatchReturnHref(query.returnTo);
 const selected=Array.isArray(rawTab)?rawTab[0]:rawTab;
 const aliases:Record<string,string>={classes:"classes",registration:"registrations",students:"students",registrations:"registrations",rules:"rules",history:"history"};
 if(selected && aliases[selected])redirect("/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected]);const context=await getCurrentRequestContext();
 const [{batch,lifecycle,ready,decision},eligibility,history,registrations,invitePreview]=await Promise.all([getTpoBatch(context,batchId),getTpoBatchEligibilitySummary(context,batchId),listTpoBatchHistory(context,batchId),getTpoBatchRegistrationSummary(context,batchId),getTpoBatchInvitationPreview(context,batchId)]);
 const undoable=actionableBatchHistory(history.events).find(event=>event.canRequestUndo);
 const summary=eligibility.summary;
 const own=await getTpoBatchOwnDecisionSummary(context,batchId).catch(()=>null);
 const next=projectTpoBatchNextStep({finished:Boolean(lifecycle?.finishedAt),activeLearners:registrations.activeLearners,
   eligible:summary.complete?summary.eligible:null,undecided:summary.complete?summary.undecided:null,
   invited:Boolean(lifecycle?.invitedAt),deadline:lifecycle?.registrationDeadline??null,
   invitable:invitePreview.invitable,registered:registrations.registered},new Date());
 const tabs=[{label:"Students",href:"students"},{label:"Registrations",href:"registrations"},{label:"Rules",href:"rules"},{label:"History",href:"history"}] as const;
 return <div className="min-w-0 space-y-5"><PageHeader eyebrow="TPO · Batches" title={batch.name} description={batch.program+" · "+batch.department+(batch.startYear?" · "+batch.startYear+(batch.endYear?"–"+batch.endYear:""):"")}/>
 <Link href={backHref} className="text-sm text-link underline">← Placement eligibility</Link>
 {undoable?<details className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3">
  <summary className="min-h-11 cursor-pointer font-semibold text-link"
   title={"Undo the latest "+String(undoable.after??"eligibility")+" decision. The server checks for intervening changes."}>
   Undo last decision
  </summary>
  <p className="my-2 text-sm text-muted-foreground">Only the latest unreversed batch or learner action can be undone. A newer decision will block this request.</p>
  <TpoBatchUndoControl batchId={batchId} actionId={undoable.actionId}/>
 </details>:null}
 <TpoBatchWorkspaceTabs batchId={batchId} active="" students={summary.assessed} />
 {ready&&summary.complete&&summary.undecided>0?<p data-testid="batch.suggest" className="rounded border border-border bg-surface p-3 text-sm">
  Suggested: make them eligible <Link href={"/tpo/batches/"+batchId+"/students?decision=NOT_DECIDED"}
   className="ml-2 font-semibold text-link underline" data-testid="batch.suggest-do">Do it</Link>
  </p>:ready&&!lifecycle?.invitedAt&&invitePreview.invitable>0?<p data-testid="batch.suggest"
   className="rounded border border-border bg-surface p-3 text-sm">
   Suggested: invite the batch (Next step, above) <Link href="#batch-next-step"
    className="ml-2 font-semibold text-link underline" data-testid="batch.suggest-do">Show me</Link>
  </p>:ready&&next.button==="Remind or move deadline"?<p data-testid="batch.suggest" className="rounded border border-border bg-surface p-3 text-sm">
   Suggested: remind them to register <Link href="#batch-reminder" className="ml-2 font-semibold text-link underline" data-testid="batch.suggest-do">Show me</Link>
  </p>:null}
 {own?<Link href={"/tpo/batches/"+batchId+"/students?source=LEARNER"}
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
   {own.total} {own.total===1?"student is":"students are"} decided individually
   {own.uncertain>0?", "+own.uncertain+" need class review":own.different===0?", all the same as their class or batch":", "+own.different+" differ from their class or batch"} →
  </Link>:<p role="status" className="text-sm text-body">Individual decision counts are unavailable. Review learner decisions on Students.</p>}
 <section aria-label="Whole batch eligibility decision" className="space-y-2 border-b border-border py-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="font-semibold">Whole batch</h2>
      <p className="text-sm text-body">Decision: <strong>{decision.status.replaceAll("_"," ")}</strong></p>
      {decision.reason?<p className="text-xs text-muted-foreground">Reason: {decision.reason}</p>:null}
    </div>
    <Link href={"/tpo/batches/"+batchId+"/rules"} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link">
      {lifecycle?.finishedAt?"Review batch decision":"Set batch decision"} →
    </Link>
  </div>
  {decision.status==="INELIGIBLE"?<p className="text-sm text-warning">The batch is ineligible: {decision.reason??"No reason recorded"}. Classes or students set to Eligible are still in placements.</p>:null}
 </section>
 <p className="inline-flex rounded-[var(--lms-control-radius)] border border-border px-3 py-1 text-sm font-semibold" role="status">
  {ready?tpoBatchPlacementState({finishedAt:lifecycle?.finishedAt??null,
   eligible:summary.complete?summary.eligible:null}):"Status unavailable"}
 </p>
 {ready && registrations.available ? <section id="batch-invite" aria-label="Invite learners to register"><TpoBatchInvitationControl
  batchId={batchId} invitedAt={lifecycle?.invitedAt?.toISOString() ?? null}
  finishedAt={lifecycle?.finishedAt?.toISOString() ?? null}
  deadline={lifecycle?.registrationDeadline?.toISOString() ?? null}
  expectedVersion={lifecycle?.updatedAt.toISOString() ?? "none"}
  invitable={invitePreview.invitable} eligible={invitePreview.eligible}
  deadlinePassed={registrations.invitation.stage === "DEADLINE_PASSED"}
  minDate={indianCalendarDate(new Date())} /></section> : null}
 {ready?<TpoBatchLifecycleControl batchId={batchId} state={lifecycle?{
  invitedAt:lifecycle.invitedAt?.toISOString()??null,finishedAt:lifecycle.finishedAt?.toISOString()??null,
  expectedVersion:lifecycle.updatedAt.toISOString(),
 }:null}/>:null}
 <section aria-label="Batch eligibility snapshot" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <h2 className="font-semibold">Eligibility decisions</h2>
  <p className="text-sm text-muted-foreground">{summary.complete?
   "Inherited learner, class and batch decisions for the active roster.":
   "Partial snapshot: only the first "+eligibility.limit+" learners were assessed. Do not treat these counts as batch totals."}</p>
  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
   {[
    ["Eligible",summary.eligible],["Ineligible",summary.ineligible],
    ["Not decided",summary.undecided],["Needs review",summary.needsReview],
   ].map(([label,value])=><div key={label} className="rounded border border-border p-2 text-sm">
    <dt>{label}</dt><dd className="font-semibold tabular-nums">{value}</dd>
   </div>)}
  </dl>
  {summary.complete&&summary.assessed>0?
   <div role="img" aria-label={summary.eligible+" eligible, "+summary.ineligible+" ineligible, "+summary.undecided+" not decided, "+summary.needsReview+" need review"}
    className="flex h-3 overflow-hidden rounded-full bg-muted">
    <span className="bg-success" style={{width:100*summary.eligible/summary.assessed+"%"}}/>
    <span className="bg-warning" style={{width:100*summary.ineligible/summary.assessed+"%"}}/>
    <span className="bg-primary" style={{width:100*summary.undecided/summary.assessed+"%"}}/>
   </div>:null}
  <p className="text-sm">Next step: {eligibility.nextAction==="REVIEW"?"Review incomplete or ambiguous decisions":
    eligibility.nextAction==="DECIDE"?"Decide undecided learners":
    eligibility.nextAction==="INVITE"?"Review batch invitation readiness":"Review finished batch"}</p>
  <Link href={"/tpo/batches/"+batchId+"/students"} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm">Open Students</Link>
 </section>

 <section id="batch-next-step" aria-label="Next step" tabIndex={-1}
  className="scroll-mt-24 space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 target:animate-pulse">
  <h2 className="font-semibold">Next step</h2>
  <h3 className="text-lg font-semibold">{next.title}</h3>
  <p className="text-sm text-body">{next.detail}</p>
  <div className="flex flex-wrap gap-3">
   <Link href={"/tpo/batches/"+batchId+next.href}
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
    {next.button} →
   </Link>
   {registrations.available&&(registrations.registered??0)>0?<Link href={"/tpo/batches/"+batchId+"/students"}
    className="inline-flex min-h-9 items-center text-sm font-semibold text-link">
    {registrations.registered} students registered: continue on Students →
   </Link>:null}
  </div>
 </section>


 <nav aria-label="Batch workspace" className="flex flex-wrap gap-2">{tabs.map(tab=><Link key={tab.href} className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm" href={"/tpo/batches/"+batchId+"/"+tab.href}>{tab.label}</Link>)}</nav>
 <p className="rounded border border-border p-4 text-sm">Choose Students for eligibility, Registrations for recorded choices, Rules for policy, or History for decisions and exact undo.</p>
 </div>;
}
