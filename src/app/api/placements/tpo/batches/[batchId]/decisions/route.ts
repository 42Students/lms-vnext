import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { decidePlacementParticipation, PlacementBatchError } from "@/modules/placements/batch-participation-service";
import { tpoBatchDecisionSchema } from "@/modules/placements/tpo-batch-decision-model";
export const runtime="nodejs";
type Params={params:Promise<{batchId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const ctx = __actor!;
    const {batchId}=params;
    const {collegeId,ready,lifecycle}=await getTpoBatch(ctx,batchId);
    if(lifecycle?.finishedAt)return NextResponse.json({error:"BATCH_FINISHED"},{status:409});
    if(!ready)return NextResponse.json({error:"BATCH_MIGRATION_PENDING"},{status:503});
    const input=tpoBatchDecisionSchema.parse(await request.json());
    const outcome=await decidePlacementParticipation(ctx,{collegeId,expectedCohortId:batchId,changes:[{
   scopeType:"COHORT",scopeId:batchId,status:input.decision,
   reason:input.decision==="INELIGIBLE"?input.reason:null,expectedVersion:input.expectedVersion,
  }]});
    return NextResponse.json(outcome,{headers:{"Cache-Control":"private, no-store"}});
  },
);
