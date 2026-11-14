import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { learnerProgramEnrollments, collegeMemberships } from "@/db/schema";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementEligibilityEvents } from "@/db/schema/placement-batches";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { placementTableExists } from "@/modules/placements/staged-tables";
import { undoPlacementParticipation, PlacementBatchError } from "@/modules/placements/batch-participation-service";
import { privateJson } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
const inputSchema=z.object({actionId:zUuid}).strict();
export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: __actor, params }) => {
    const ctx = __actor!;
    try {
const {batchId}=params;
const {collegeId}=await getTpoBatch(ctx,batchId);
if(!await placementTableExists("placement_eligibility_events"))
   return NextResponse.json({error:"BATCH_MIGRATION_PENDING"},{status:503});
const {actionId}=inputSchema.parse(await boundedRequestJson(request));
const events=await getDb().select({scopeType:placementEligibilityEvents.scopeType,
   scopeId:placementEligibilityEvents.scopeId})
   .from(placementEligibilityEvents)
   .where(and(eq(placementEligibilityEvents.collegeId,collegeId),
    eq(placementEligibilityEvents.actionId,actionId),
    eq(placementEligibilityEvents.eventKind,"DECIDE")));
if(events.length===0||events.some(e=>e.scopeType==="SECTION"||
    (e.scopeType==="COHORT"&&e.scopeId!==batchId)||
    (e.scopeType!=="COHORT"&&e.scopeType!=="MEMBERSHIP")))
   return NextResponse.json({error:"BATCH_ACTION_NOT_FOUND"},{status:404});
const membershipIds=events.filter(e=>e.scopeType==="MEMBERSHIP").map(e=>e.scopeId);
if(membershipIds.length){
   const matching=await getDb().select({id:learnerProgramEnrollments.membershipId})
    .from(learnerProgramEnrollments)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
    .where(and(eq(learnerProgramEnrollments.cohortId,batchId),
      eq(learnerProgramEnrollments.status,"ACTIVE"),eq(collegeMemberships.collegeId,collegeId),
      inArray(learnerProgramEnrollments.membershipId,membershipIds)));
   if(new Set(matching.map(r=>r.id)).size!==new Set(membershipIds).size)
    return NextResponse.json({error:"BATCH_ACTION_NOT_FOUND"},{status:404});
  }
const result=await undoPlacementParticipation(ctx,{collegeId,actionId});
return privateJson(result);
} catch(error){
  if(error instanceof PlacementBatchError&&error.code==="DB08_ACTION_STALE")
   return NextResponse.json({error:"BATCH_ACTION_STALE"},{status:409});
  return apiErrorResponse(error);
 }
  },
);
