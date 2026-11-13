import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { decidePlacementParticipation, PlacementBatchError } from "@/modules/placements/batch-participation-service";
import { tpoBatchDecisionSchema } from "@/modules/placements/tpo-batch-decision-model";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{batchId:string}>};
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const ctx = __actor!;
    try {
const {batchId}=params;
const {collegeId,ready,lifecycle}=await getTpoBatch(ctx,batchId);
if(lifecycle?.finishedAt)return NextResponse.json({error:"BATCH_FINISHED"},{status:409});
if(!ready)return NextResponse.json({error:"BATCH_MIGRATION_PENDING"},{status:503});
const input=tpoBatchDecisionSchema.parse(await boundedRequestJson(request));
const outcome=await decidePlacementParticipation(ctx,{collegeId,expectedCohortId:batchId,changes:[{
   scopeType:"COHORT",scopeId:batchId,status:input.decision,
   reason:input.decision==="INELIGIBLE"?input.reason:null,expectedVersion:input.expectedVersion,
  }]});
return privateJson(outcome);
} catch(error){
  if(error instanceof PlacementBatchError&&["DB08_ACTION_STALE","DB08_BATCH_FINISHED"].includes(error.code))
   return NextResponse.json({error:"BATCH_DECISION_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
  },
);
