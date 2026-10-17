import Link from "next/link";
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
export const dynamic="force-dynamic";
export default async function BatchPage({params,searchParams}:{params:Promise<{batchId:string}>;searchParams:Promise<{tab?:string|string[]}>}){
 const {batchId}=await params;
 const rawTab=(await searchParams).tab;
 const selected=Array.isArray(rawTab)?rawTab[0]:rawTab;
 const aliases:Record<string,string>={classes:"classes",registration:"registrations",students:"students",registrations:"registrations",rules:"rules",history:"history"};
 if(selected && aliases[selected])redirect("/tpo/batches/"+encodeURIComponent(batchId)+"/"+aliases[selected]);const context=await getCurrentRequestContext();
 const [{batch,lifecycle,ready,decision},eligibility,history,registrations,invitePreview]=await Promise.all([getTpoBatch(context,batchId),getTpoBatchEligibilitySummary(context,batchId),listTpoBatchHistory(context,batchId),getTpoBatchRegistrationSummary(context,batchId),getTpoBatchInvitationPreview(context,batchId)]);
 const undoable=actionableBatchHistory(history.events).find(event=>event.canRequestUndo);
 const summary=eligibility.summary;
 const tabs=[{label:"Students",href:"students"},{label:"Registrations",href:"registrations"},{label:"Rules",href:"rules"},{label:"History",href:"history"}] as const;
 return <main className="min-w-0 space-y-5"><PageHeader eyebrow="TPO · Batches" title={batch.name} description={batch.program+" · "+batch.department+(batch.startYear?" · "+batch.startYear+(batch.endYear?"–"+batch.endYear:""):"")}/>
 <Link href="/tpo/batches" className="text-sm text-primary-text underline">← Placement eligibility</Link>
 <TpoBatchWorkspaceTabs batchId={batchId} active="" students={summary.assessed} />
 <section aria-label="Whole batch eligibility decision" className="space-y-2 rounded-lg border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="font-semibold">Whole batch</h2>
      <p className="text-sm text-body">Decision: <strong>{decision.status.replaceAll("_"," ")}</strong></p>
      {decision.reason?<p className="text-xs text-muted-foreground">Reason: {decision.reason}</p>:null}
    </div>
    <Link href={"/tpo/batches/"+batchId+"/rules"} className="inline-flex min-h-10 items-center rounded-md border border-border px-3 font-semibold text-primary-text">
      {lifecycle?.finishedAt?"Review batch decision":"Set batch decision"} →
    </Link>
  </div>
  {decision.status==="INELIGIBLE"?<p className="text-sm text-warning">The batch is ineligible: {decision.reason??"No reason recorded"}. Classes or students set to Eligible are still in placements.</p>:null}
 </section>
 <p className="inline-flex rounded-md border border-border px-3 py-1 text-sm font-semibold" role="status">
  {ready?tpoBatchPlacementState({finishedAt:lifecycle?.finishedAt??null,
   eligible:summary.complete?summary.eligible:null}):"Status unavailable"}
 </p>
 {ready && registrations.available ? <TpoBatchInvitationControl
  batchId={batchId} invitedAt={lifecycle?.invitedAt?.toISOString() ?? null}
  finishedAt={lifecycle?.finishedAt?.toISOString() ?? null}
  deadline={lifecycle?.registrationDeadline?.toISOString() ?? null}
  expectedVersion={lifecycle?.updatedAt.toISOString() ?? "none"}
  invitable={invitePreview.invitable} eligible={invitePreview.eligible}
  deadlinePassed={registrations.invitation.stage === "DEADLINE_PASSED"}
  minDate={indianCalendarDate(new Date())} /> : null}
 {ready?<TpoBatchLifecycleControl batchId={batchId} state={lifecycle?{
  invitedAt:lifecycle.invitedAt?.toISOString()??null,finishedAt:lifecycle.finishedAt?.toISOString()??null,
  expectedVersion:lifecycle.updatedAt.toISOString(),
 }:null}/>:null}
 <section aria-label="Batch eligibility snapshot" className="min-w-0 space-y-3 rounded-lg border border-border bg-surface p-4">
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
  <Link href={"/tpo/batches/"+batchId+"/students"} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm">Open Students</Link>
 </section>
 {undoable?<section className="rounded-lg border border-border bg-surface p-4">
  <h2 className="font-semibold">Undo last decision</h2>
  <p className="my-2 text-sm text-muted-foreground">Only the latest unreversed cohort action is offered. If any later change occurred, the server will reject the undo.</p>
  <TpoBatchUndoControl batchId={batchId} actionId={undoable.actionId}/>
 </section>:null}
 <section aria-label="Next step" className="space-y-3 rounded-lg border border-border bg-surface p-4">
  <h2 className="font-semibold">Next step</h2>
  {lifecycle?.finishedAt ? <p className="text-sm text-body">This batch is finished. Review its history; eligibility editing is closed.</p> :
   summary.assessed===0 ? <p className="text-sm text-body">No active learners are recorded in this batch. Add students to an academic class first.</p> :
   summary.undecided>0 ? <p className="text-sm text-body">Decide who is in placements. {summary.undecided} learners are not yet decided.</p> :
   !lifecycle?.invitedAt ? <p className="text-sm text-body">Eligibility is ready to review. Invite eligible learners to register.</p> :
   (registrations.unrecorded ?? 0)>0 ? <p className="text-sm text-body">{registrations.unrecorded} learners still need to record their registration choice.</p> :
   <p className="text-sm text-body">All recorded learners have a registration choice. Review the next steps on Students.</p>}
  <div className="flex flex-wrap gap-3">
    <Link href={"/tpo/batches/"+batchId+(lifecycle?.finishedAt?"/history":summary.undecided>0?"/students?decision=NOT_DECIDED":!lifecycle?.invitedAt?"/invitation-prep":"/registrations")}
      className="inline-flex min-h-10 items-center rounded-md border border-border px-3 font-semibold text-primary-text">
      {lifecycle?.finishedAt?"Review history":summary.undecided>0?"Decide learners":!lifecycle?.invitedAt?"Invite to register":"Review registrations"} →
    </Link>
    {registrations.available?<Link href={"/tpo/batches/"+batchId+"/students"}
      className="inline-flex min-h-10 items-center px-3 font-semibold text-primary-text">
      {registrations.registered} students registered: continue on Students →
    </Link>:null}
  </div>
 </section>
 <section aria-label="Registration decisions" className="min-w-0 space-y-3 rounded-lg border border-border p-4">
  <h2 className="font-semibold">Registration choices</h2>
  <p className="text-sm">Registration window: {registrations.invitation.stage.replaceAll("_"," ").toLowerCase()}</p>
  {registrations.invitation.deadline?<p className="text-xs text-muted-foreground">Deadline (absolute time): {registrations.invitation.deadline}</p>:null}
  {registrations.invitation.markedAt?<p className="text-xs text-muted-foreground">
   Invitation marked: {registrations.invitation.markedAt}. This is not a delivery receipt.</p>:null}
  {!registrations.available?<p role="status" className="text-sm">Registration storage is unavailable; no counts are inferred.</p>:
   <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {[
     ["Active learners",registrations.activeLearners],
     ["Choices recorded",registrations.registered],
     ["No choice recorded",registrations.unrecorded],
     ["Placements",registrations.byChoice?.PLACEMENTS],
     ["Higher studies",registrations.byChoice?.HIGHER_STUDIES],
     ["Other choices",(registrations.byChoice?.NOT_INTERESTED??0)+(registrations.byChoice?.ENTREPRENEURSHIP??0)+(registrations.byChoice?.COMPETITIVE_EXAMS??0)],
    ].map(([name,value])=><div key={name} className="rounded border border-border p-2 text-sm">
     <dt>{name}</dt><dd className="font-semibold tabular-nums">{value??"—"}</dd>
    </div>)}
   </dl>}
  <p className="text-xs text-muted-foreground">Registration choices come from DB08 records; invitation, eligibility and consent are separate facts. A learner choosing Placements must have recorded their own consent.</p>
 </section>
 <Link href={"/tpo/batches/"+batchId+"/invitation-prep"} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Prepare invitation draft</Link>
 <Link href={"/tpo/batches/"+batchId+"/reminder-prep"} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-primary-text">Prepare registration reminder</Link>
 <nav aria-label="Batch workspace" className="flex flex-wrap gap-2">{tabs.map(tab=><Link key={tab.href} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm" href={"/tpo/batches/"+batchId+"/"+tab.href}>{tab.label}</Link>)}</nav>
 <p className="rounded border border-border p-4 text-sm">Choose Students for eligibility, Registrations for recorded choices, Rules for policy, or History for decisions and exact undo.</p>
 </main>;
}
