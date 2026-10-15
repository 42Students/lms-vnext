import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {CoursesServiceError} from "./errors";
import {getFacultySubmissionReviewPage} from "./faculty-submission-review-service";
import {getFacultyAssignmentReport} from "./faculty-assessment-report-service";
import {aiGradingSelectionSchema} from "./faculty-ai-grading-model";
import {facultyAiGradingEligible} from "./faculty-ai-grading-eligibility";

/** Both readers enforce persisted current teaching Section and assignment ownership.
 * No database write and no private learner email in this view model. */
export async function getFacultyAiGradingReview(context:RequestContext,raw:unknown){
 const selection=aiGradingSelectionSchema.parse(raw);
 if(!context.membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY"))
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 requirePermission(context,"courses.read",{
  collegeId:context.membership.collegeId,organizationId:context.membership.organizationId,
 });
 const [review,report]=await Promise.all([
  getFacultySubmissionReviewPage(context,{
   deliveryId:selection.deliveryId,assignmentId:selection.assignmentId,
   filter:"ALL",page:selection.page,
  }),
  getFacultyAssignmentReport(context,selection.assignmentId,selection.deliveryId),
 ]);
 const rows=review.items.map(row=>({
  id:row.id,version:row.version,submissionType:row.submissionType,
  gradingStatus:row.gradingStatus,gradePublished:row.gradePublished,
  submittedAt:row.submittedAt,textContent:row.submissionType==="TEXT"?row.textContent:null,
  learnerLabel:row.learnerDisplayName?.trim()||"Learner (name unavailable)",
  eligible:facultyAiGradingEligible(row),
 }));
 const selected=selection.submissionId?rows.find(row=>row.id===selection.submissionId):undefined;
 if(selection.submissionId&&!selected)throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 return {
  assignment:{id:report.assignment.id,title:report.assignment.title,
   deliveryId:selection.deliveryId,maxPoints:report.assignment.maxPoints},
  page:review.page,total:review.total,totalPages:review.totalPages,
  rows,selected:selected??null,
 };
}
