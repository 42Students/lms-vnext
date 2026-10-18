import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions,projectDeliveryEvents} from "@/db/schema";
import {requireProjectLifecycleMutationAccess} from "./access";
import type {RequestContext} from "@/modules/identity/context";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {canAdminSettleDelivery} from "./admin-submission-review-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {projectDeliveryActivity} from "./delivery-activity-model";
import {notifyActiveProjectMembers} from "./project-notification-service";
const body=z.strictObject({reason:z.string().trim().min(1).max(4000),expectedUpdatedAt:z.iso.datetime({offset:true})});
export async function lockMentorFinalDelivery(context:RequestContext,projectIdInput:string,submissionIdInput:string,raw:unknown){
 const projectId=z.string().uuid().parse(projectIdInput),submissionId=z.string().uuid().parse(submissionIdInput);
 const input=body.parse(raw),scope=await requireProjectLifecycleMutationAccess(context,projectId);
 if(scope.access!=="MENTOR"||!context.membership)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const membership=context.membership;
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project)throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [submission]=await tx.select().from(projectSubmissions).where(and(
   eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id)))
   .for("update").limit(1);
  if(!project||!submission||!canAdminSettleDelivery(submission.status,Boolean(submission.lockedAt),project.status,"LOCK")||
    submission.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
    throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const now=new Date(Math.max(Date.now(),submission.updatedAt.getTime()+1));
  const [saved]=await tx.update(projectSubmissions).set({lockedAt:now,updatedAt:now})
    .where(and(eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id),
      isNull(projectSubmissions.lockedAt))).returning();
  if(!saved)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  await tx.insert(projectDeliveryEvents).values({
    projectId:scope.project.id,submissionId,actorMembershipId:membership.id,
    eventType:"LOCKED",reason:input.reason,occurredAt:now,
  });
  const event=await recordActivityEventInTransaction(tx,context,projectDeliveryActivity({
    action:"LOCKED",collegeId:scope.collegeId,organizationId:scope.organizationId,
    projectId:scope.project.id,submissionId,version:saved.version,
  }));
  await notifyActiveProjectMembers(tx,event.id,{projectId:scope.project.id,collegeId:scope.collegeId,
   roles:["LEARNER"],exceptUserId:context.user.id,title:"Final delivery locked",
   body:input.reason,actionHref:"/learn/projects/"+scope.project.id+"?tab=delivery"});
  return saved;
 });
}
