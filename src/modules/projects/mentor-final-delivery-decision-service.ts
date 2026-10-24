import "server-only";
import {and,desc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions,projectSubmissionReviews,projectDeliveryEvents} from "@/db/schema";
import {type RequestContext,hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {projectSubmissionIdSchema} from "./validation";
import {mentorFinalDeliveryCanReview,mentorFinalDeliveryDecisionSchema} from "./mentor-final-delivery-decision-model";
import {projectDeliveryActivity} from "./delivery-activity-model";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {learnerProjectDeliveryReviewNotice} from "./learner-project-review-notification-model";

export async function decideMentorFinalDelivery(context:RequestContext,projectId:string,
 submissionIdInput:string,raw:unknown){
 const input=mentorFinalDeliveryDecisionSchema.parse(raw);
 const scope=await requireProjectLifecycleMutationAccess(context,projectId);
 const membership=context.membership;
 if(scope.access!=="MENTOR"||!membership||!hasActiveMembership(context)||
 !hasMembershipRole(context,"MENTOR")||!can(context,"projects.read",{
  collegeId:scope.collegeId,organizationId:scope.organizationId,
 }))throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
 const submissionId=projectSubmissionIdSchema.parse(submissionIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({
    status:projectInstances.status,deletedAt:projectInstances.deletedAt,
  }).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!project||project.deletedAt)
    throw new ProjectsServiceError("PROJECT_SUBMISSION_NOT_FOUND");
  // The read-only page grant may have expired while the mentor reviewed it.
  // Recheck the persisted user, membership and project assignment under lock.
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [submission]=await tx.select().from(projectSubmissions).where(and(
   eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id),
  )).for("update").limit(1);
  if(!submission)throw new ProjectsServiceError("PROJECT_SUBMISSION_NOT_FOUND");
  if(!project||!mentorFinalDeliveryCanReview(submission.status,project.status,Boolean(submission.lockedAt)))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  // The project row lock serializes new draft/version creation. Never accept
  // a stale URL naming an older submission, even if its status was corrupted
  // or left SUBMITTED by a previous deployment.
  const [latest]=await tx.select({id:projectSubmissions.id})
   .from(projectSubmissions).where(eq(projectSubmissions.projectId,scope.project.id))
   .orderBy(desc(projectSubmissions.version)).limit(1);
  if(latest?.id!==submission.id)
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const expected=new Date(input.expectedUpdatedAt);
  if(submission.updatedAt.getTime()!==expected.getTime())
   throw new ProjectsServiceError("PROJECT_SUBMISSION_STALE_VERSION");
  const now=new Date(Math.max(Date.now(),submission.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectSubmissions).set({
    status:input.decision,updatedAt:now,
    ...(input.decision==="APPROVED"?{lockedAt:now,reopenedAt:null}:{}),
  }).where(and(eq(projectSubmissions.id,submission.id),
   eq(projectSubmissions.projectId,scope.project.id),
   eq(projectSubmissions.status,"SUBMITTED"),
   sql`date_trunc('milliseconds', ${projectSubmissions.updatedAt}) = ${expected.toISOString()}::timestamptz`,
  )).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_STALE_VERSION");
  const [review]=await tx.insert(projectSubmissionReviews).values({
   projectId:scope.project.id,submissionId:submission.id,decision:input.decision,
   feedback:input.feedback??null,reviewedByUserId:context.user.id,
   reviewedByMembershipId:membership.id,
  }).returning();
  // Review events belong to the same immutable, project-scoped activity stream
  // as submissions and locks, with exact decision and review ID preserved.
  const activity=projectDeliveryActivity({
   action:"REVIEWED",collegeId:scope.collegeId,organizationId:scope.organizationId,
   projectId:scope.project.id,submissionId:submission.id,version:submission.version,
   decision:input.decision,
  });
  const reviewedEvent = await recordActivityEventInTransaction(tx,context,{
   ...activity,
   summary:input.decision==="APPROVED"?"Project delivery approved":"Project delivery changes requested",
   metadata:{...activity.metadata,reviewId:review!.id},
  });
  // LEARNER-projects-R01: project reviews reach active learners through the same transaction.
  const notice=learnerProjectDeliveryReviewNotice(scope.project.id,input.decision);
  await notifyActiveProjectMembers(tx,reviewedEvent.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,roles:["LEARNER"],
    exceptUserId:context.user.id,title:notice.title,body:notice.body,actionHref:notice.actionHref,
  });
  if(input.decision==="APPROVED"){
   // MEN-projects-meetings-R01: reopening an accepted delivery requires a
   // persisted lock, and registered 0091 requires a matching immutable event.
   await tx.insert(projectDeliveryEvents).values({
    projectId:scope.project.id,submissionId:updated.id,
    eventType:"LOCKED",actorMembershipId:membership.id,
    reason:"Submission approved",occurredAt:now,
   });
   await recordActivityEventInTransaction(tx,context,projectDeliveryActivity({
    action:"LOCKED",collegeId:scope.collegeId,organizationId:scope.organizationId,
    projectId:scope.project.id,submissionId:updated.id,version:updated.version,
   }));
  }
  return {submission:updated,review:review!};
 });
}
