import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions,projectSubmissionReviews} from "@/db/schema";
import {type RequestContext,hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {projectSubmissionIdSchema} from "./validation";
import {mentorFinalDeliveryCanReview,mentorFinalDeliveryDecisionSchema} from "./mentor-final-delivery-decision-model";

export async function decideMentorFinalDelivery(context:RequestContext,projectId:string,
 submissionIdInput:string,raw:unknown){
 const input=mentorFinalDeliveryDecisionSchema.parse(raw);
 const scope=await requireProjectReadAccess(context,projectId);
 const membership=context.membership;
 if(scope.access!=="MENTOR"||!membership||!hasActiveMembership(context)||
 !hasMembershipRole(context,"MENTOR")||!can(context,"projects.read",{
  collegeId:scope.collegeId,organizationId:scope.organizationId,
 }))throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
 const submissionId=projectSubmissionIdSchema.parse(submissionIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(eq(projectInstances.id,scope.project.id)).for("update").limit(1);
  const [submission]=await tx.select().from(projectSubmissions).where(and(
   eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id),
  )).for("update").limit(1);
  if(!submission)throw new ProjectsServiceError("PROJECT_SUBMISSION_NOT_FOUND");
  if(!project||!mentorFinalDeliveryCanReview(submission.status,project.status))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const expected=new Date(input.expectedUpdatedAt);
  if(submission.updatedAt.getTime()!==expected.getTime())
   throw new ProjectsServiceError("PROJECT_SUBMISSION_STALE_VERSION");
  const now=new Date(Math.max(Date.now(),submission.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectSubmissions).set({
    status:input.decision,updatedAt:now,
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
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REVIEWED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_submission",subjectId:submission.id,
   summary:input.decision==="APPROVED"?"Project delivery approved":"Project delivery changes requested",
   metadata:{projectId:scope.project.id,version:submission.version,decision:input.decision,
    reviewId:review!.id},
   groupKey:"project:"+scope.project.id+":final-review",
  });
  return {submission:updated,review:review!};
 });
}
