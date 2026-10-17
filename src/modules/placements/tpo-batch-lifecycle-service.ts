import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,membershipRoles,users} from "@/db/schema";
import {placementBatchLifecycles} from "@/db/schema/placement-batches";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {planTpoBatchLifecycle,TpoBatchLifecycleError} from "./tpo-batch-lifecycle-model";
const inputSchema=z.object({batchId:z.string().uuid(),action:z.enum(["FINISH","REOPEN"]),
 expectedVersion:z.union([z.literal("none"),z.iso.datetime({offset:true})])}).strict();
export async function changeTpoBatchLifecycle(ctx:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw);
 const {collegeId,ready}=await getTpoBatch(ctx,input.batchId);
 if(!ready)throw new TpoBatchLifecycleError("BATCH_MIGRATION_PENDING");
 return getDb().transaction(async tx=>{
  const [college]=await tx.select({id:colleges.id,organizationId:colleges.organizationId}).from(colleges)
   .where(eq(colleges.id,collegeId)).for("update").limit(1);
  if(!college)throw new AuthorizationError("placements.manage");
  const [persisted]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"TPO")))
   .where(and(eq(collegeMemberships.id,ctx.membership!.id),eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.userId,ctx.user.id),eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(!persisted)throw new AuthorizationError("placements.manage");
  const [current]=await tx.select().from(placementBatchLifecycles)
   .where(and(eq(placementBatchLifecycles.cohortId,input.batchId),
    eq(placementBatchLifecycles.collegeId,collegeId))).for("update").limit(1);
  if(!current){
   if(input.action!=="FINISH"||input.expectedVersion!=="none")
    throw new TpoBatchLifecycleError("BATCH_ACTION_STALE");
   const now=new Date();
   const [created]=await tx.insert(placementBatchLifecycles).values({
    cohortId:input.batchId,collegeId,invitedAt:null,finishedAt:now,
    createdByUserId:ctx.user.id,updatedByUserId:ctx.user.id,updatedAt:now,
   }).onConflictDoNothing().returning();
   if(!created)throw new TpoBatchLifecycleError("BATCH_ACTION_STALE");
   await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId,
    actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
    module:"PLACEMENTS",eventType:"placements.batch.finished",
    subjectType:"COHORT",subjectId:input.batchId,
    summary:"TPO marked placement batch finished",
    metadata:{action:input.action,invitationNeverSent:true},
   });
   return {changed:true,version:created.updatedAt.toISOString()};
  }
  const plan=planTpoBatchLifecycle(current,input.action,input.expectedVersion);
  if(!plan.changed)return {changed:false,version:current.updatedAt.toISOString()};
  const [updated]=await tx.update(placementBatchLifecycles).set({
   finishedAt:plan.shouldFinish?new Date():null,updatedAt:new Date(),updatedByUserId:ctx.user.id,
  }).where(and(eq(placementBatchLifecycles.cohortId,input.batchId),
   eq(placementBatchLifecycles.collegeId,collegeId))).returning();
  if(!updated)throw new TpoBatchLifecycleError("BATCH_NOT_STARTED");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,
   module:"PLACEMENTS",eventType:plan.shouldFinish?"placements.batch.finished":"placements.batch.reopened",
   subjectType:"COHORT",subjectId:input.batchId,
   summary:plan.shouldFinish?"TPO marked placement batch finished":"TPO reopened placement batch",
   metadata:{action:input.action},
  });
  return {changed:true,version:updated.updatedAt.toISOString()};
 });
}
