import "server-only";
import {and,desc,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectDeliveryEvents,projectEvaluations,projectInstances,projectSubmissions} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {learnerProjectDeliveryReopenedNotice} from "./learner-project-review-notification-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {projectDeliveryLockInputSchema,mayReopenApprovedDelivery} from "./pr-s2-07-delivery-reopen-model";
import {projectSubmissionIdSchema} from "./validation";

/** Registered 0091: immutable approved revision, explicit checked reopen, append-only event. */
export async function reopenApprovedProjectDelivery(context:RequestContext,projectIdInput:string,submissionIdInput:string,rawInput:unknown){
 const scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
 if(!context.membership||context.membership.collegeId!==scope.collegeId)
   throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
 const submissionId=projectSubmissionIdSchema.parse(submissionIdInput);
 const input=projectDeliveryLockInputSchema.parse(rawInput);
 const actorMembershipId=context.membership.id;
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({
    status:projectInstances.status,deletedAt:projectInstances.deletedAt,
  }).from(projectInstances)
    .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
    .for("update").limit(1);
  if(!project||project.status!=="ACTIVE"||project.deletedAt)
    throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  // The earlier page/scope check is not a transaction-level authorization:
  // lock and re-read the Mentor/Admin grant and membership before mutating
  // the approved delivery or emitting learner notices.
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [latest]=await tx.select().from(projectSubmissions)
    .where(eq(projectSubmissions.projectId,scope.project.id))
    .orderBy(desc(projectSubmissions.version)).for("update").limit(1);
  if(!latest||latest.id!==submissionId||latest.status!=="APPROVED"||
     !latest.lockedAt||latest.reopenedAt||
     latest.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
    throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const [evaluation]=await tx.select({id:projectEvaluations.id}).from(projectEvaluations)
    .where(and(eq(projectEvaluations.projectId,scope.project.id),
      eq(projectEvaluations.submissionId,latest.id))).limit(1);
  if(!mayReopenApprovedDelivery(project.status,Boolean(evaluation)))
    throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const now=new Date(Math.max(Date.now(),latest.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectSubmissions).set({reopenedAt:now,updatedAt:now})
    .where(and(eq(projectSubmissions.id,latest.id),eq(projectSubmissions.projectId,scope.project.id),
      eq(projectSubmissions.status,"APPROVED"),isNull(projectSubmissions.reopenedAt),
      sql`date_trunc('milliseconds', ${projectSubmissions.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`))
    .returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  await tx.insert(projectDeliveryEvents).values({
    projectId:scope.project.id,submissionId:updated.id,eventType:"REOPENED",
    actorMembershipId,reason:input.reason,
  });
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REOPENED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_submission",subjectId:updated.id,subjectLabel:"Project delivery",
    summary:"Submission reopened for revision.",
    metadata:{projectId:scope.project.id,version:updated.version},
    groupKey:"project:"+scope.project.id+":deliveries",
    dedupeKey:"project-delivery:"+updated.id+":reopened",
  });
  const notice=learnerProjectDeliveryReopenedNotice(scope.project.id);
  await notifyActiveProjectMembers(tx,event.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,
    roles:["LEARNER"],exceptUserId:context.user.id,
    title:notice.title,body:notice.body,actionHref:notice.actionHref,
  });
  return {submissionId:updated.id,projectId:scope.project.id,reopened:true};
 });
}
