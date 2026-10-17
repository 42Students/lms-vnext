import {batchRuleDate} from "@/modules/placements/tpo-batch-labels-model";
import {TpoBatchRuleEditor} from "@/components/tpo/tpo-batch-rule-editor";
import {getCollegePlacementRules} from "@/modules/placements/tpo-policy-service";
import {tpoBatchRuleOverridesSchema} from "@/modules/placements/tpo-batch-rules-model";
import Link from "next/link";
import { TpoBatchWorkspaceTabs } from "@/components/tpo/tpo-batch-workspace-tabs";
import { TpoBatchDecisionControl } from "@/components/tpo/tpo-batch-decision-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchRules({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const ctx=await getCurrentRequestContext();
 const {batch,collegeId,lifecycle,ready,decision}=await getTpoBatch(ctx,batchId);
 const college=await getCollegePlacementRules(ctx,collegeId);
 const stored=tpoBatchRuleOverridesSchema.safeParse(lifecycle?.rulesOverride??{});
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{batch.name} — Rules</h1>
 <TpoBatchWorkspaceTabs batchId={batchId} active="rules" />
 {!ready?<p role="status" className="rounded border border-border p-4">Batch rules are temporarily unavailable. You can review other batch details and try again.</p>:
 <section className="rounded border border-border p-4"><h2 className="font-semibold">Participation policy</h2>
 <dl className="mt-3 space-y-2 text-sm"><div><dt className="font-semibold">Registration deadline</dt><dd>{batchRuleDate(lifecycle?.registrationDeadline)}</dd></div>
 <div><dt className="font-semibold">Invited</dt><dd>{batchRuleDate(lifecycle?.invitedAt)}</dd></div>
 <div><dt className="font-semibold">Finished</dt><dd>{lifecycle?.finishedAt?batchRuleDate(lifecycle.finishedAt):"Still accepting placements"}</dd></div></dl>
 <p className="mt-3 text-sm text-muted-foreground">The college placement rules apply unless this batch has approved changes.</p></section>}
 {stored.success?<TpoBatchRuleEditor batchId={batchId} batchName={batch.name}
  college={{countsAsPlacedAt:college.countsAsPlacedAt as "OFFER_RELEASED"|"OFFER_ACCEPTED",maxHeldOffers:college.maxHeldOffers,
    upliftPct:college.upliftPct,minResponseHours:college.minResponseHours}}
  initialOverride={stored.data} expectedVersion={lifecycle?.updatedAt.toISOString()??"none"}
  readOnly={!ready||Boolean(lifecycle?.finishedAt)}/>:<p role="alert">Batch rules could not be read safely. Refresh before editing.</p>}
 {ready&&!lifecycle?.finishedAt?<TpoBatchDecisionControl batchId={batchId} current={decision}/>:
  <p role="status" className="rounded border border-border bg-surface p-3 text-sm">
   {lifecycle?.finishedAt?"This batch is finished. Eligibility decisions are read-only.":"Batch eligibility decisions are temporarily unavailable. Retry when the rules are available."}
  </p>}
 <Link href="/tpo/settings/rules" className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm">View college placement rules</Link>
 </main>;
}
