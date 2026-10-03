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
