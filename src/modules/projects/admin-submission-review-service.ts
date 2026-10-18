import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions,projectDeliveryEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {mayRecordCollegeAdminDeliveryLock} from "./admin-submission-lock-policy";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {projectDeliveryActivity} from "./delivery-activity-model";
import {canAdminSettleDelivery} from "./admin-submission-review-model";
const id=z.string().uuid();
const body=z.strictObject({reason:z.string().trim().min(1).max(4000)});
export async function lockAdminProjectSubmission(ctx:RequestContext,projectIdRaw:string,submissionIdRaw:string,raw:unknown){
 const scope=await requireProjectManageAccess(ctx,id.parse(projectIdRaw));
 if(!mayRecordCollegeAdminDeliveryLock(ctx,scope.collegeId,scope.organizationId)||!ctx.membership)
  throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
 const actorMembershipId=ctx.membership.id;
 const submissionId=id.parse(submissionIdRaw),input=body.parse(raw);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  // RequestContext is a snapshot: an administrator may be suspended or lose
  // College Admin status after opening the dialog. Validate the persisted
  // actor under SHARE locks in the same transaction that writes the event.
  const persisted=await assertPersistedPlatformPermission(tx,ctx,"projects.manage",{
   organizationId:scope.organizationId,collegeId:scope.collegeId,
  });
  if(!mayRecordCollegeAdminDeliveryLock(persisted,scope.collegeId,scope.organizationId)||
     persisted.membership?.id!==actorMembershipId)
   throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  const [submission]=await tx.select().from(projectSubmissions)
   .where(and(eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id)))
   .for("update").limit(1);
  if(!project||!submission||!canAdminSettleDelivery(submission.status,!!submission.lockedAt,project.status,"LOCK"))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const now=new Date();
  const [saved]=await tx.update(projectSubmissions).set({lockedAt:now,updatedAt:now})
   .where(and(eq(projectSubmissions.id,submissionId),
    eq(projectSubmissions.projectId,scope.project.id),isNull(projectSubmissions.lockedAt)))
   .returning();
  if(!saved)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  await tx.insert(projectDeliveryEvents).values({projectId:scope.project.id,
   submissionId,actorMembershipId,eventType:"LOCKED",reason:input.reason,occurredAt:now});
  await recordActivityEventInTransaction(tx,ctx,projectDeliveryActivity({
   action:"LOCKED",collegeId:scope.collegeId,organizationId:scope.organizationId,
   projectId:scope.project.id,submissionId,version:saved.version,
  }));
  return saved;
 });
}
