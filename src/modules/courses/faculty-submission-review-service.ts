import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseAssignments, courseLessons, courseLearningPaths } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { listAssignmentSubmissions } from "./assignment-submission-service";
import { CoursesServiceError } from "./errors";
import { facultySubmissionListPage, facultySubmissionListQuerySchema, selectFacultyAssignmentSubmissions } from "./faculty-assignment-submissions-model";
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
  const rows = await listAssignmentSubmissions(context,query.assignmentId,query.deliveryId);
  const selected = selectFacultyAssignmentSubmissions(rows,query.filter,assignment.dueAt);
  return facultySubmissionReviewResponse(facultySubmissionListPage(selected,query.page));
}
