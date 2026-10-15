import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementEligibilityEvents } from "@/db/schema/placement-batches";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { undoPlacementParticipation, PlacementBatchError } from "@/modules/placements/batch-participation-service";
export const runtime="nodejs";
const inputSchema=z.object({actionId:z.string().uuid()}).strict();
export async function POST(request:Request,{params}:{params:Promise<{batchId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const ctx=await getCurrentRequestContext(),{batchId}=await params;
  const {collegeId}=await getTpoBatch(ctx,batchId);
  const {actionId}=inputSchema.parse(await request.json());
  const events=await getDb().select({scopeType:placementEligibilityEvents.scopeType,
   scopeId:placementEligibilityEvents.scopeId})
   .from(placementEligibilityEvents)
   .where(and(eq(placementEligibilityEvents.collegeId,collegeId),
    eq(placementEligibilityEvents.actionId,actionId),
    eq(placementEligibilityEvents.eventKind,"DECIDE")));
  if(events.length===0||events.some(e=>e.scopeType!=="COHORT"||e.scopeId!==batchId))
   return NextResponse.json({error:"BATCH_ACTION_NOT_FOUND"},{status:404});
  const result=await undoPlacementParticipation(ctx,{collegeId,actionId});
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof PlacementBatchError&&error.code==="DB08_ACTION_STALE")
   return NextResponse.json({error:"BATCH_ACTION_STALE"},{status:409});
  return apiErrorResponse(error);
 }
}
