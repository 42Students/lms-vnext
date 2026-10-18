import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementApplications,placementJobs,placementLearnerRequests} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {PlacementsServiceError} from "./errors";
import {sameTpoBulkRequestRun,persistedTpoBulkRequestCount} from "./tpo-request-bulk-run-model";
import {requireTpoJobActor} from "./tpo-job-write-base";

const uuid=z.string().uuid();
const schema=z.strictObject({
 runId:uuid,action:z.enum(["APPROVE","REJECT"]),
 requestIds:z.array(uuid).min(1).max(10).refine(ids=>new Set(ids).size===ids.length),
});
/** One audit event per previewed batch. Actual outcomes come ONLY from the DB.
 * A lost response can safely retry this run ID without a duplicate activity.
 */
export async function recordTpoBulkRequestRun(ctx:RequestContext,raw:unknown){
 const input=schema.parse(raw),actor=ctx.membership;
 if(!actor||!hasMembershipRole(ctx,"TPO")||actor.status!=="ACTIVE"||
   !can(ctx,"placements.manage",{collegeId:actor.collegeId}))
  throw new AuthorizationError("placements.manage");
 requirePermission(ctx,"placements.manage",{collegeId:actor.collegeId});
 const college=await requirePlacementManageScope(ctx,actor.collegeId);
 return getDb().transaction(async tx=>{
  // Bulk run metadata is a mutation: a stale TPO cookie must not create
  // activity history after the persisted team membership was revoked.
  await requireTpoJobActor(tx,ctx);
  const dedupeKey="tpo-requests-bulk:"+college.id+":"+input.runId;
  const [prior]=await tx.select({id:activityEvents.id,metadata:activityEvents.metadata}).from(activityEvents)
   .where(and(eq(activityEvents.collegeId,college.id),eq(activityEvents.dedupeKey,dedupeKey))).limit(1);
  if(prior){
   // A caller must not reuse a run ID to mask a different action or set of
   // learners under an existing audit event.
   if(!sameTpoBulkRequestRun(prior.metadata,input))
    throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   const verifiedCount=persistedTpoBulkRequestCount(prior.metadata,input.requestIds.length);
   if(verifiedCount===null)throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   return {eventId:prior.id,replayed:true,verifiedCount};
  }
  const rows=await tx.select({id:placementLearnerRequests.id,status:placementLearnerRequests.status})
   .from(placementLearnerRequests)
   .innerJoin(placementApplications,eq(placementApplications.id,placementLearnerRequests.applicationId))
   .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
   .where(and(eq(placementJobs.collegeId,college.id),
    inArray(placementLearnerRequests.id,input.requestIds)));
  if(rows.length!==input.requestIds.length)
   throw new PlacementsServiceError("PLACEMENT_REQUEST_NOT_FOUND");
  const desired=input.action==="APPROVE"?"APPROVED":"REJECTED";
  const count=rows.filter(row=>row.status===desired).length;
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:ctx.user.id,actorMembershipId:actor.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_REQUESTS_BULK_REVIEWED",
   subjectType:"placement_request_bulk",subjectId:input.runId,
   summary:count+" of "+rows.length+" requests confirmed "+desired.toLowerCase()+" in this batch",
   metadata:{action:input.action,requestIds:input.requestIds,verifiedCount:count,
    notInDesiredState:rows.filter(row=>row.status!==desired).map(row=>row.id)},
   dedupeKey,
  }).onConflictDoNothing().returning({id:activityEvents.id});
  if(!event){
   // Concurrent requests may both miss the initial read. The unique audit
   // key chooses one winner; inspect it before calling the retry successful.
   const [winner]=await tx.select({id:activityEvents.id,metadata:activityEvents.metadata})
    .from(activityEvents)
    .where(and(eq(activityEvents.collegeId,college.id),eq(activityEvents.dedupeKey,dedupeKey)))
    .limit(1);
   if(!winner||!sameTpoBulkRequestRun(winner.metadata,input))
    throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   const verifiedCount=persistedTpoBulkRequestCount(winner.metadata,input.requestIds.length);
   if(verifiedCount===null)throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT");
   return {eventId:winner.id,replayed:true,verifiedCount};
  }
  return {eventId:event.id,replayed:false,verifiedCount:count};
 });
}
