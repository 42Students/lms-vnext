import "server-only";
import {and,desc,eq,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectSubmissions,projectDeliveryEvents,projectSubmissionReviews} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {mayRecordCollegeAdminDeliveryLock} from "./admin-submission-lock-policy";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {projectDeliveryActivity} from "./delivery-activity-model";
import {canAdminSettleDelivery,adminDeliveryToast} from "./admin-submission-review-model";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {learnerProjectDeliveryReviewNotice} from "./learner-project-review-notification-model";
const id=z.string().uuid();
const body=z.strictObject({reason:z.string().trim().min(1).max(4000)});
export async function lockAdminProjectSubmission(ctx:RequestContext,projectIdRaw:string,submissionIdRaw:string,raw:unknown){
 const scope=await requireProjectManageAccess(ctx,id.parse(projectIdRaw));
 if(!mayRecordCollegeAdminDeliveryLock(ctx,scope.collegeId,scope.organizationId)||!ctx.membership)
  throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
 const actorMembershipId=ctx.membership.id;
 const submissionId=id.parse(submissionIdRaw),input=body.parse(raw);
 return getDb().transaction(async tx=>{
  // Check the persisted College Admin role under SHARE locks before
  // locking the project. A revoked actor must not hold a project row lock;
  // consistent actor-before-resource order also avoids the inverse lock
  // order used by other administrative mutations.
  const persisted=await assertPersistedPlatformPermission(tx,ctx,"projects.manage",{
   organizationId:scope.organizationId,collegeId:scope.collegeId,
  });
  if(!mayRecordCollegeAdminDeliveryLock(persisted,scope.collegeId,scope.organizationId)||
     persisted.membership?.id!==actorMembershipId)
   throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  const [submission]=await tx.select().from(projectSubmissions)
   .where(and(eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id)))
   .for("update").limit(1);
  if(!project||project.deletedAt||!submission)throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  // Holding the parent FOR UPDATE serializes draft creation with this read.
  // A stale tab may retain an earlier submission ID; never lock or retry a
  // superseded revision, even if that older row was already locked.
  const [latest]=await tx.select({id:projectSubmissions.id})
   .from(projectSubmissions)
   .where(eq(projectSubmissions.projectId,scope.project.id))
   .orderBy(desc(projectSubmissions.version)).limit(1);
  if(latest?.id!==submissionId)
   throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  // Two tabs may retry a lock after the first response was lost. Both the
  // parent and the submission are locked, so returning the already-locked row
  // is safe, does not rewrite its reason, and cannot duplicate audit history.
  // An archived/completed workspace must not turn an old lock into a write.
  if(project.status==="ACTIVE"&&submission.lockedAt&&
     (submission.status==="SUBMITTED"||submission.status==="APPROVED")){
    // Idempotency applies only to the exact same actor and reason. A second
    // administrator or altered reason cannot silently claim the first lock.
    const [previousLock]=await tx.select({
      reason:projectDeliveryEvents.reason,
      actorMembershipId:projectDeliveryEvents.actorMembershipId,
    }).from(projectDeliveryEvents).where(and(
      eq(projectDeliveryEvents.projectId,scope.project.id),
      eq(projectDeliveryEvents.submissionId,submissionId),
      eq(projectDeliveryEvents.eventType,"LOCKED"),
    )).orderBy(desc(projectDeliveryEvents.occurredAt),desc(projectDeliveryEvents.id)).limit(1);
    if(previousLock?.reason===input.reason&&
       previousLock.actorMembershipId===actorMembershipId)return submission;
    throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  }
  if(!canAdminSettleDelivery(submission.status,!!submission.lockedAt,project.status,"LOCK"))
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

const adminReviewInput=z.strictObject({
 action:z.enum(["APPROVED","CHANGES_REQUESTED"]),
 feedback:z.string().trim().max(4000).optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
}).superRefine((input,ctx)=>{
 if(input.action==="CHANGES_REQUESTED"&&!input.feedback)
  ctx.addIssue({code:"custom",path:["feedback"],message:"Explain what needs to change."});
});
/** College administrator final-delivery review uses the same persisted state
 * machine as mentor review. Approval and explicit LOCK remain separate actions. */
export async function reviewAdminProjectSubmission(
 ctx:RequestContext,projectIdRaw:string,submissionIdRaw:string,raw:unknown,
){
 const input=adminReviewInput.parse(raw);
 const scope=await requireProjectManageAccess(ctx,id.parse(projectIdRaw));
 const submissionId=id.parse(submissionIdRaw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"projects.manage",{
   organizationId:scope.organizationId,collegeId:scope.collegeId,
  });
  const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})
   .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
    eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  const [submission]=await tx.select().from(projectSubmissions).where(and(
   eq(projectSubmissions.id,submissionId),eq(projectSubmissions.projectId,scope.project.id),
  )).for("update").limit(1);
  if(!project||!submission)throw new ProjectsServiceError("PROJECT_SUBMISSION_NOT_FOUND");
  // A response retry must never resurrect a review on a deleted workspace.
  if(project.deletedAt)throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const [latest]=await tx.select({id:projectSubmissions.id}).from(projectSubmissions)
   .where(eq(projectSubmissions.projectId,scope.project.id))
   .orderBy(desc(projectSubmissions.version)).limit(1);
  if(latest?.id!==submissionId)throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
  const expected=new Date(input.expectedUpdatedAt);
  // A lost response can be retried without duplicating events or rewriting feedback.
  if(submission.status===input.action){
   const [previous]=await tx.select().from(projectSubmissionReviews).where(and(
    eq(projectSubmissionReviews.projectId,scope.project.id),
    eq(projectSubmissionReviews.submissionId,submissionId),
   )).limit(1);
   if(previous&&previous.decision===input.action&&
      previous.reviewedByUserId===ctx.user.id&&
      (previous.feedback??"")===(input.feedback??""))
    return {submission,review:previous,message:adminDeliveryToast(input.action)};
  }
  if(!canAdminSettleDelivery(submission.status,Boolean(submission.lockedAt),project.status,input.action))
   throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  if(submission.updatedAt.getTime()!==expected.getTime())
   throw new ProjectsServiceError("PROJECT_SUBMISSION_STALE_VERSION");
  const now=new Date(Math.max(Date.now(),submission.updatedAt.getTime()+1));
  const [updated]=await tx.update(projectSubmissions).set({
   status:input.action,updatedAt:now,
  }).where(and(eq(projectSubmissions.id,submissionId),
   eq(projectSubmissions.projectId,scope.project.id),
   eq(projectSubmissions.status,"SUBMITTED"),
   sql`date_trunc('milliseconds', ${projectSubmissions.updatedAt}) = ${expected.toISOString()}::timestamptz`,
  )).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_SUBMISSION_STALE_VERSION");
  const [review]=await tx.insert(projectSubmissionReviews).values({
   projectId:scope.project.id,submissionId,decision:input.action,
   feedback:input.feedback??null,reviewedByUserId:ctx.user.id,
   reviewedByMembershipId:ctx.membership&&ctx.membership.collegeId===scope.collegeId
     ?ctx.membership.id:null,
   reviewedAt:now,
  }).returning();
  if(!review)throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
  const event=await recordActivityEventInTransaction(tx,ctx,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_DELIVERY_REVIEWED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_submission",subjectId:submissionId,
   summary:input.action==="APPROVED"?"Project delivery approved":"Project delivery changes requested",
   metadata:{projectId:scope.project.id,version:updated.version,
    action:input.action,reviewId:review.id,feedback:input.feedback??null},
   groupKey:"project:"+scope.project.id+":final-review",
  });
  const notice=learnerProjectDeliveryReviewNotice(scope.project.id,input.action);
  await notifyActiveProjectMembers(tx,event.id,{
   projectId:scope.project.id,collegeId:scope.collegeId,roles:["LEARNER"],
   exceptUserId:ctx.user.id,title:notice.title,body:notice.body,actionHref:notice.actionHref,
  });
  return {submission:updated,review,message:adminDeliveryToast(input.action)};
 });
}

/** Merge normalized revisions, immutable review decisions and delivery events
 * into the single chronological story provided by the legacy workspace.
 * Approval/request-changes are represented by a durable
 * project_submission_reviews row (which records feedback, user, membership,
 * decision, and timestamp) rather than an extra technical delivery event.
 * The technical table's allowed event types are LOCKED, REOPENED and
 * ATTACHMENTS_CHANGED. Do not bypass that constraint to duplicate a review.
 */
export async function listAdminProjectDeliveryHistory(ctx:RequestContext,rawProjectId:string){
 const scope=await requireProjectManageAccess(ctx,id.parse(rawProjectId));
 const [versions,reviews,events]=await Promise.all([
  getDb().select({
   id:projectSubmissions.id,version:projectSubmissions.version,
   status:projectSubmissions.status,summary:projectSubmissions.summary,
   createdAt:projectSubmissions.createdAt,createdBy:projectSubmissions.createdByMembershipId,
   submittedAt:projectSubmissions.submittedAt,submittedBy:projectSubmissions.submittedByMembershipId,
  }).from(projectSubmissions).where(eq(projectSubmissions.projectId,scope.project.id)),
  getDb().select().from(projectSubmissionReviews)
   .where(eq(projectSubmissionReviews.projectId,scope.project.id)),
  getDb().select().from(projectDeliveryEvents)
   .where(eq(projectDeliveryEvents.projectId,scope.project.id)),
 ]);
 const entries=[
  ...versions.flatMap(item=>[
   {id:item.id+":created",submissionId:item.id,action:"DRAFT_SAVED",
    occurredAt:item.createdAt,actorMembershipId:item.createdBy,feedback:null,
    snapshot:{version:item.version,status:"DRAFT",summary:item.summary}},
   ...(item.submittedAt?[{
    id:item.id+":submitted",submissionId:item.id,action:"SUBMITTED",
    occurredAt:item.submittedAt,actorMembershipId:item.submittedBy,feedback:null,
    snapshot:{version:item.version,status:"SUBMITTED",summary:item.summary},
   }]:[]),
  ]),
  ...reviews.map(row=>({
   id:row.id,submissionId:row.submissionId,action:row.decision,
   occurredAt:row.reviewedAt,actorMembershipId:row.reviewedByMembershipId,
   feedback:row.feedback,snapshot:{decision:row.decision,reviewedByUserId:row.reviewedByUserId},
  })),
  ...events.map(row=>({
   id:row.id,submissionId:row.submissionId,
   action:row.legacyAction??row.eventType,occurredAt:row.occurredAt,
   actorMembershipId:row.actorMembershipId,feedback:row.legacyFeedback??row.reason,
   snapshot:{status:row.legacyStatus??null,notes:row.legacyNotes??null},
  })),
 ];
 return entries.sort((a,b)=>a.occurredAt.getTime()-b.occurredAt.getTime()||
  a.id.localeCompare(b.id));
}
