import "server-only";
import {assignmentGradeEventsStaged} from "@/db/schema/db06-history-staged";
import {assignmentSubmissions} from "@/db/schema/assessments";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type Submission=typeof assignmentSubmissions.$inferSelect;
export async function appendAssignmentGradeAudit(
 tx:Tx,ctx:RequestContext,collegeId:string,
 before:Submission,after:Submission,action:"GRADE"|"REGRADE"|"HIDE_GRADE"|"PUBLISH_GRADE",
){
 if(after.version!==before.version+1||
  after.assignmentId!==before.assignmentId||
  after.deliveryId!==before.deliveryId||
  after.membershipId!==before.membershipId||
  after.id!==before.id)throw new Error("GRADE_AUDIT_MISMATCH");
 const role=ctx.membership?.roles.includes("FACULTY")?"FACULTY":
  ctx.membership?.roles.includes("COLLEGE_ADMIN")?"COLLEGE_ADMIN":"SUPER_ADMIN";
 await tx.insert(assignmentGradeEventsStaged).values({
  assignmentSubmissionId:after.id,assignmentId:after.assignmentId,
  deliveryId:after.deliveryId,learnerMembershipId:after.membershipId,
  collegeId,actorUserId:ctx.user.id,
  actorMembershipId:role==="SUPER_ADMIN"?null:ctx.membership?.id??null,
  actorRole:role,action,
  previousPoints:before.pointsAwarded,newPoints:after.pointsAwarded,
  previousFeedback:before.feedback,newFeedback:after.feedback,
  previousGradingStatus:before.gradingStatus,newGradingStatus:after.gradingStatus,
  previousGradePublished:before.gradePublished,newGradePublished:after.gradePublished,
  previousGradedByUserId:before.gradedByUserId,newGradedByUserId:after.gradedByUserId,
  previousGradedAt:before.gradedAt,newGradedAt:after.gradedAt,
  submissionVersionBefore:before.version,submissionVersionAfter:after.version,
 });
}
