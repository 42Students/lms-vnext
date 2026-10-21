import {
  and,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  assignmentSubmissions,
  courseAssignments,
} from "@/db/schema";
import { CoursesServiceError } from "./errors";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
} from "./scope";

/** Legacy assignment-scope error copy for API/UI adapters. Identifiers in
 * vNext are UUIDs; do not imply an old numeric lesson content ID is valid. */
export function assignmentScopeUserMessage(code:string):string{
 switch(code){
  case "ASSIGNMENT_NOT_FOUND":return "Assignment not found";
  case "LESSON_CONTENT_NOT_FOUND":return "Lesson content not found";
  case "ASSIGNMENT_SUBMISSION_NOT_FOUND":return "Assignment submission not found";
  case "ASSIGNMENT_DELIVERY_MISMATCH":return "This assignment is not in the selected class or course";
  case "LEARNING_ACCESS_DENIED":return "You do not have access to this class or course";
  default:return "Could not load this assignment. Check its lesson and class scope.";
 }
}

export async function loadCourseAssignmentScope(
  assignmentId: string,
  includeArchived = false,
) {
  const conditions = [
    eq(courseAssignments.id, assignmentId),
  ];

  if (!includeArchived) {
    conditions.push(
      ne(courseAssignments.status, "ARCHIVED"),
    );
  }

  const [assignment] = await getDb()
    .select()
    .from(courseAssignments)
    .where(and(...conditions))
    .limit(1);

  if (!assignment) {
    throw new CoursesServiceError(
      "ASSIGNMENT_NOT_FOUND",
    );
  }

  const lesson = await loadCourseLessonScope(
    assignment.lessonId,
    includeArchived,
  );

  if (assignment.deliveryId) {
    const delivery =
      await loadCourseSectionDeliveryScope(
        assignment.deliveryId,
        true,
      );

    if (
      delivery.offeringId !==
      lesson.offeringId
    ) {
      throw new CoursesServiceError(
        "ASSIGNMENT_DELIVERY_MISMATCH",
      );
    }
  }

  return {
    ...assignment,
    offeringId: lesson.offeringId,
    learningPathId: lesson.learningPathId,
    learningPathStatus:
      lesson.learningPathStatus,
    lessonVisibleToStudents: lesson.visibleToStudents,
    collegeId: lesson.collegeId,
    organizationId: lesson.organizationId,
  };
}

export async function loadAssignmentSubmissionScope(
  submissionId: string,
) {
  const [submission] = await getDb()
    .select()
    .from(assignmentSubmissions)
    .where(
      eq(
        assignmentSubmissions.id,
        submissionId,
      ),
    )
    .limit(1);

  if (!submission) {
    throw new CoursesServiceError(
      "ASSIGNMENT_SUBMISSION_NOT_FOUND",
    );
  }

  const assignment =
    await loadCourseAssignmentScope(
      submission.assignmentId,
      true,
    );
  const delivery =
    await loadCourseSectionDeliveryScope(
      submission.deliveryId,
      true,
    );

  if (
    delivery.offeringId !==
      assignment.offeringId ||
    (assignment.deliveryId &&
      assignment.deliveryId !== delivery.id)
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_DELIVERY_MISMATCH",
    );
  }

  return {
    ...submission,
    maxPoints: assignment.maxPoints,
    assignmentStatus: assignment.status,
    collegeId: assignment.collegeId,
    organizationId: assignment.organizationId,
  };
}
