import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { decidePlacementParticipation, PlacementBatchError } from "@/modules/placements/batch-participation-service";
import { tpoBatchDecisionSchema } from "@/modules/placements/tpo-batch-decision-model";
export const runtime="nodejs";
type Params={params:Promise<{batchId:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext(),{batchId}=await params;
  const {collegeId,ready}=await getTpoBatch(ctx,batchId);
  if(!ready)return NextResponse.json({error:"BATCH_MIGRATION_PENDING"},{status:503});
  const input=tpoBatchDecisionSchema.parse(await request.json());
  // This endpoint changes the COHORT scope only, never a learner's override.
  const outcome=await decidePlacementParticipation(ctx,{collegeId,changes:[{
   scopeType:"COHORT",scopeId:batchId,status:input.decision,
   reason:input.decision==="INELIGIBLE"?input.reason:null,expectedVersion:input.expectedVersion,
  }]});
  return NextResponse.json(outcome,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PlacementBatchError&&error.code==="DB08_ACTION_STALE")
   return NextResponse.json({error:"BATCH_DECISION_CHANGED"},{status:409});
  return apiErrorResponse(error);
 }
}
