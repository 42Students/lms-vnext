import {PageHeader} from "@/components/ui/page-header";
import {batchRuleDate} from "@/modules/placements/tpo-batch-labels-model";
import {TpoBatchRuleEditor} from "@/components/tpo/tpo-batch-rule-editor";
import {tpoBatchRuleOverridesSchema} from "@/modules/placements/tpo-batch-rules-model";
import Link from "next/link";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import { TpoBatchDecisionControl } from "@/components/tpo/tpo-batch-decision-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getLegacyCompatibleBatchDetails } from "@/modules/placements/tpo-batch-legacy-detail-service";
export const dynamic="force-dynamic";
export default async function BatchRules({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const ctx=await getCurrentRequestContext();
 const detail=await getLegacyCompatibleBatchDetails(ctx,batchId);
 const {batch,lifecycle,ready,decision,college,effective,jobTypes,legacyState,classes}=detail;
 const stored=tpoBatchRuleOverridesSchema.safeParse(lifecycle?.rulesOverride??{});
 return <div className="min-w-0 space-y-4"><PageHeader title={batch.name+" — Rules"} description="Participation rules and effective decisions."/>
 <TpoBatchWorkspaceTabs batchId={batchId} active="rules" />
 {ready&&!lifecycle?.finishedAt?<TpoBatchDecisionControl batchId={batchId} current={decision}/>:
  <p role="status" className="border-l-2 border-primary bg-primary-subtle px-3 py-3 text-sm leading-[22px]">
   {lifecycle?.finishedAt?"This batch is finished. Eligibility decisions are read-only.":"Batch eligibility decisions are temporarily unavailable. Retry when the rules are available."}
  </p>}

 {!ready?<p role="status" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm leading-[22px]">Batch rules are temporarily unavailable. You can review other batch details and try again.</p>:
 <section aria-labelledby="section-participation-policy" className="border-b border-[var(--lms-canvas-border)] py-4"><h2 id="section-participation-policy" className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Participation policy</h2>
 <dl className="mt-3 grid min-w-0 gap-3 text-sm sm:grid-cols-3"><div><dt className="font-semibold">Registration deadline</dt><dd>{batchRuleDate(lifecycle?.registrationDeadline)}</dd></div>
 <div><dt className="font-semibold">Invited</dt><dd>{batchRuleDate(lifecycle?.invitedAt)}</dd></div>
 <div><dt className="font-semibold">Finished</dt><dd>{lifecycle?.finishedAt?batchRuleDate(lifecycle.finishedAt):"Still accepting placements"}</dd></div></dl>
 <p className="mt-3 text-sm text-muted-foreground leading-[22px]">The college placement rules apply unless this batch has approved changes.</p>
 <dl aria-label="Batch policy overview" className="mt-4 grid min-w-0 grid-cols-2 gap-3 text-sm md:grid-cols-4">
  <div><dt className="font-semibold">Batch state</dt><dd>{legacyState.replaceAll("_"," ")}</dd></div>
  <div><dt className="font-semibold">Classes</dt><dd>{classes.length}</dd></div>
  <div><dt className="font-semibold">Job types</dt><dd>{jobTypes.length}</dd></div>
  <div><dt className="font-semibold">Rule source</dt><dd>{Object.keys(detail.batchRules).length>0?"Batch override + college defaults":"College defaults"}</dd></div>
 </dl>
 <details className="mt-4 border-t border-border pt-3">
  <summary className="min-h-11 cursor-pointer text-sm font-semibold text-link">Review effective batch policy and job types</summary>
  <p className="mt-2 text-sm text-muted-foreground">The batch inherits unspecified fields from college rules. Job-type placed flags are college-scoped.</p>
  <dl className="mt-2 grid min-w-0 gap-3 text-sm sm:grid-cols-2">
   <div><dt className="font-semibold">Counts as placed at</dt><dd>{effective.countsAsPlacedAt.replaceAll("_"," ")}</dd></div>
   <div><dt className="font-semibold">Maximum held offers</dt><dd>{effective.maxHeldOffers}</dd></div>
   <div><dt className="font-semibold">Offer uplift %</dt><dd>{effective.upliftPct}%</dd></div>
   <div><dt className="font-semibold">Minimum response hours</dt><dd>{effective.minResponseHours}</dd></div>
  </dl>
  {!detail.jobTypesAvailable?<p role="status" className="mt-2 text-sm text-warning">Custom job types could not load. Built-in labels are shown.</p>:null}
  <ul className="mt-3 divide-y divide-border border-y border-border" aria-label="Job types and placed treatment">
   {jobTypes.map(row=><li key={row.name} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-2 text-sm">
    <span className="font-semibold">{row.name}</span>
    <span className="text-muted-foreground">{row.countsAsPlaced?"Counts as placed":"Does not count as placed"} · {row.drives} {row.drives===1?"drive":"drives"}</span>
   </li>)}
  </ul>
 </details></section>}
 {stored.success?<TpoBatchRuleEditor batchId={batchId} batchName={batch.name}
  college={{countsAsPlacedAt:college.countsAsPlacedAt as "OFFER_RELEASED"|"OFFER_ACCEPTED",maxHeldOffers:college.maxHeldOffers,
    upliftPct:college.upliftPct,minResponseHours:college.minResponseHours}}
  initialOverride={stored.data} expectedVersion={lifecycle?.updatedAt.toISOString()??"none"}
  readOnly={!ready||Boolean(lifecycle?.finishedAt)}/>:<p role="alert">Batch rules could not be read safely. Refresh before editing.</p>}
 <Link href="/tpo/settings/rules" className="lms-inline-link inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">View college placement rules</Link>
 </div>;
}
