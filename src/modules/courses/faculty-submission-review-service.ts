import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {z} from "zod";
import { courseAssignments, courseLessons, courseLearningPaths,
 assignmentSubmissions,courseSectionDeliveries,sectionEnrollments,
 learnerProgramEnrollments,collegeMemberships,membershipRoles,users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { listAssignmentSubmissions,listAssignmentSubmissionsPage } from "./assignment-submission-service";
import { CoursesServiceError } from "./errors";
import { facultySubmissionListPage, facultySubmissionListQuerySchema, selectFacultyAssignmentSubmissions, facultySubmissionSqlPageWindow } from "./faculty-assignment-submissions-model";
import { facultySubmissionReviewResponse } from "./faculty-submission-review-model";

export async function getFacultySubmissionReviewPage(context: RequestContext, raw: unknown) {
  const query = facultySubmissionListQuerySchema.parse(raw);
  requirePermission(context,"courses.read",{collegeId:context.membership?.collegeId,
    organizationId:context.membership?.organizationId});
  const deliveries = await listFacultyCourseDeliveries(context);
  const delivery = deliveries.find(item=>item.deliveryId===query.deliveryId);
  if (!delivery) throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
  // A foreign/nonexistent assignment produces the same non-leaking denial.
  const [assignment] = await getDb().select({id:courseAssignments.id,
    status:courseAssignments.status,dueAt:courseAssignments.dueAt})
    .from(courseAssignments)
    .innerJoin(courseLessons,eq(courseLessons.id,courseAssignments.lessonId))
    .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
    .where(and(eq(courseAssignments.id,query.assignmentId),
      eq(courseLearningPaths.offeringId,delivery.offeringId),
      or(isNull(courseAssignments.deliveryId),eq(courseAssignments.deliveryId,query.deliveryId))))
    .limit(1);
  if (!assignment) throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
  if (assignment.status !== "PUBLISHED") throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
  // The unfiltered review is pageable in SQL, avoiding loading all
  // submissions to render one drawer page. Authorization is checked before
  // either the count or the SELECT can expose tenant-private rows.
  if(query.filter==="ALL"){
    const first=await listAssignmentSubmissionsPage(context,query.assignmentId,
      query.deliveryId,{limit:20,offset:(query.page-1)*20});
    const window=facultySubmissionSqlPageWindow(query.page,first.total);
    const pageRows=window.page===query.page?first.submissions:
      (await listAssignmentSubmissionsPage(context,query.assignmentId,query.deliveryId,{
        limit:window.limit,offset:window.offset,
      })).submissions;
    return facultySubmissionReviewResponse({page:window.page,
      pageSize:window.limit,total:window.total,totalPages:window.totalPages,
      items:pageRows});
  }
  // Timing/grade filters must be applied before pagination; never paginate
  // raw rows and then claim an incomplete page is the entire match set.
  const rows = await listAssignmentSubmissions(context,query.assignmentId,query.deliveryId);
  const selected = selectFacultyAssignmentSubmissions(rows,query.filter,assignment.dueAt);
  return facultySubmissionReviewResponse(facultySubmissionListPage(selected,query.page));
}

/** Legacy submissionStats/bulk parity on the authenticated teaching roster.
 * Both paths use the same bounded, tenant-scoped query; unknown assignments
 * cannot disclose whether a learner submitted in another Section.
 */
const facultyStatsRequest=z.strictObject({
 deliveryId:z.string().uuid(),
 assignmentIds:z.array(z.string().uuid()).min(1).max(100),
}).refine(input=>new Set(input.assignmentIds).size===input.assignmentIds.length,
 {message:"Assignment IDs must be unique",path:["assignmentIds"]});

export async function getFacultyAssignmentSubmissionStatsBulk(
 context:RequestContext,raw:unknown,
) {
 const input=facultyStatsRequest.parse(raw);
 requirePermission(context,"courses.read",{
  collegeId:context.membership?.collegeId,
  organizationId:context.membership?.organizationId,
 });
 const teaching=await listFacultyCourseDeliveries(context);
 const delivery=teaching.find(item=>item.deliveryId===input.deliveryId);
 if(!delivery)throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 const db=getDb();
 const allowed=await db.select({id:courseAssignments.id})
  .from(courseAssignments)
  .innerJoin(courseLessons,eq(courseLessons.id,courseAssignments.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .where(and(inArray(courseAssignments.id,input.assignmentIds),
    eq(courseLearningPaths.offeringId,delivery.offeringId),
    eq(courseAssignments.status,"PUBLISHED"),
    or(isNull(courseAssignments.deliveryId),eq(courseAssignments.deliveryId,input.deliveryId))));
 const ids=allowed.map(row=>row.id);
 if(!ids.length)return {};
 const section=await db.select({sectionId:courseSectionDeliveries.sectionId})
  .from(courseSectionDeliveries).where(eq(courseSectionDeliveries.id,input.deliveryId)).limit(1);
 if(!section.length)throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 const roster=await db.selectDistinct({membershipId:collegeMemberships.id})
  .from(sectionEnrollments)
  .innerJoin(learnerProgramEnrollments,eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"LEARNER")))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .where(and(eq(sectionEnrollments.sectionId,section[0].sectionId),
    eq(sectionEnrollments.status,"ACTIVE"),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(collegeMemberships.collegeId,context.membership!.collegeId),
    eq(users.platformStatus,"ACTIVE")));
 const rosterIds=roster.map(row=>row.membershipId);
 const submitted=rosterIds.length?await db.select({
  assignmentId:assignmentSubmissions.assignmentId,
  membershipId:assignmentSubmissions.membershipId,
  gradingStatus:assignmentSubmissions.gradingStatus,
 }).from(assignmentSubmissions)
  .where(and(inArray(assignmentSubmissions.assignmentId,ids),
    eq(assignmentSubmissions.deliveryId,input.deliveryId),
    inArray(assignmentSubmissions.membershipId,rosterIds))):[];
 const answer:Record<string,{
  totalStudents:number;totalSubmitted:number;totalGraded:number;
  notGraded:number;notSubmitted:number;
  submittedLearnerIds:string[];notSubmittedLearnerIds:string[];
 }>={};
 for(const id of ids){
  const relevant=submitted.filter(item=>item.assignmentId===id);
  const sent=new Set(relevant.map(row=>row.membershipId));
  const missing=rosterIds.filter(id=>!sent.has(id));
  const graded=new Set(relevant.filter(row=>row.gradingStatus==="GRADED").map(row=>row.membershipId));
  answer[id]={
   totalStudents:rosterIds.length,totalSubmitted:sent.size,totalGraded:graded.size,
   notGraded:sent.size-graded.size,notSubmitted:missing.length,
   submittedLearnerIds:[...sent],notSubmittedLearnerIds:missing,
  };
 }
 return answer;
}
export async function getFacultyAssignmentSubmissionStats(
 context:RequestContext,deliveryId:string,assignmentId:string,
) {
 const all=await getFacultyAssignmentSubmissionStatsBulk(context,{
  deliveryId,assignmentIds:[assignmentId],
 });
 const found=all[assignmentId];
 if(!found)throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
 return found;
}
