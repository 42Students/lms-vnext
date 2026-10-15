import Link from "next/link";
import {TpoBatchLifecycleControl} from "@/components/tpo/tpo-batch-lifecycle-control";
import {TpoBatchUndoControl} from "@/components/tpo/tpo-batch-undo-control";
import {actionableBatchHistory} from "@/modules/placements/tpo-batch-history-undo-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatch, listTpoBatchHistory } from "@/modules/placements/tpo-batch-workspace-read-service";
import { getTpoBatchEligibilitySummary } from "@/modules/placements/tpo-batch-eligibility-summary-service";
import {getTpoBatchRegistrationSummary} from "@/modules/placements/tpo-batch-registration-summary-service";
import { PageHeader } from "@/components/ui/page-header";
export const dynamic="force-dynamic";
export default async function BatchPage({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;const context=await getCurrentRequestContext();
 const [{batch,lifecycle,ready},eligibility,history,registrations]=await Promise.all([getTpoBatch(context,batchId),getTpoBatchEligibilitySummary(context,batchId),listTpoBatchHistory(context,batchId),getTpoBatchRegistrationSummary(context,batchId)]);
 const undoable=actionableBatchHistory(history.events).find(event=>event.canRequestUndo);
 const summary=eligibility.summary;
 const tabs=[{label:"Students",href:"students"},{label:"Rules",href:"rules"},{label:"History",href:"history"}] as const;
 return <main className="min-w-0 space-y-5"><PageHeader eyebrow="TPO · Batches" title={batch.name} description={batch.program+" · "+batch.department}/>
 <Link href="/tpo/batches" className="text-sm text-primary-text underline">All batches</Link>
 <p className="text-sm">Status: {!ready?"Lifecycle unavailable":lifecycle?.finishedAt?"Finished":lifecycle?.invitedAt?"Invited":"Preparing"}</p>
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
  <h2 className="font-semibold">Undo last batch decision</h2>
  <p className="my-2 text-sm text-muted-foreground">Only the latest unreversed cohort action is offered. If any later change occurred, the server will reject the undo.</p>
  <TpoBatchUndoControl batchId={batchId} actionId={undoable.actionId}/>
 </section>:null}
 <section aria-label="Registration decisions" className="min-w-0 space-y-3 rounded-lg border border-border p-4">
  <h2 className="font-semibold">Registration choices</h2>
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
  <p className="text-xs text-muted-foreground">Registration choices come from DB08 records; invitation, eligibility and consent are separate facts.</p>
 </section>
 <nav aria-label="Batch workspace" className="flex flex-wrap gap-2">{tabs.map(tab=><Link key={tab.href} className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm" href={"/tpo/batches/"+batchId+"/"+tab.href}>{tab.label}</Link>)}</nav>
 <p className="rounded border border-border p-4 text-sm">Choose Students to review participation, Rules for batch policy, or History for decisions and exact undo.</p>
 </main>;
}
