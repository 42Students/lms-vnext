import "server-only";

import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {loadCourseAssignmentScope} from "./assignment-scope";
import {loadCourseSectionDeliveryScope} from "./scope";
import {listAssignmentSubmissions} from "./assignment-submission-service";
import {
 facultySubmissionListPage,facultySubmissionListQuerySchema,
 selectFacultyAssignmentSubmissions,
} from "./faculty-assignment-submissions-model";
import {facultySubmissionReviewResponse} from "./faculty-submission-review-model";
import {CoursesServiceError} from "./errors";

/** College Admin grade-review API, separate from teacher assignment assertions. */
export async function getCollegeSubmissionReviewPage(context:RequestContext,raw:unknown){
 const member=context.membership;
 const scopedSA=isSuperAdmin(context)&&Boolean(context.adminScope?.collegeId);
 if(!scopedSA&&(!member||member.status!=="ACTIVE"||
    context.user.platformStatus!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")))
  throw new AuthorizationError("courses.manage");
 const query=facultySubmissionListQuerySchema.parse(raw);
 const assignment=await loadCourseAssignmentScope(query.assignmentId,true);
 requirePermission(context,"courses.manage",{
  organizationId:assignment.organizationId,collegeId:assignment.collegeId,
 });
 if((scopedSA?context.adminScope?.collegeId:member!.collegeId)!==assignment.collegeId)
  throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 const delivery=await loadCourseSectionDeliveryScope(query.deliveryId,true);
 if(delivery.offeringId!==assignment.offeringId||
    (assignment.deliveryId&&assignment.deliveryId!==query.deliveryId))
  throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 if(assignment.status!=="PUBLISHED")
  throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
 const rows=await listAssignmentSubmissions(context,query.assignmentId,query.deliveryId);
 const selected=selectFacultyAssignmentSubmissions(rows,query.filter,assignment.dueAt);
 return facultySubmissionReviewResponse(facultySubmissionListPage(selected,query.page));
}
