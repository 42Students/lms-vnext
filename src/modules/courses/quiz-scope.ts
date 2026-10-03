import {
  and,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseQuizzes,
  quizAttempts,
} from "@/db/schema";
import { CoursesServiceError } from "./errors";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
} from "./scope";

export async function loadCourseQuizScope(
  quizId: string,
  includeArchived = false,
) {
  const conditions = [
    eq(courseQuizzes.id, quizId),
  ];

  if (!includeArchived) {
    conditions.push(
      ne(courseQuizzes.status, "ARCHIVED"),
    );
  }

  const [quiz] = await getDb()
    .select()
    .from(courseQuizzes)
    .where(and(...conditions))
    .limit(1);

  if (!quiz) {
    throw new CoursesServiceError(
      "QUIZ_NOT_FOUND",
    );
  }

  const lesson = await loadCourseLessonScope(
    quiz.lessonId,
    includeArchived,
  );

  if (quiz.deliveryId) {
    const delivery =
      await loadCourseSectionDeliveryScope(
        quiz.deliveryId,
        true,
      );

    if (
      delivery.offeringId !==
      lesson.offeringId
    ) {
      throw new CoursesServiceError(
        "QUIZ_DELIVERY_MISMATCH",
      );
    }
  }

  return {
    ...quiz,
    offeringId: lesson.offeringId,
    learningPathId: lesson.learningPathId,
    learningPathStatus:
      lesson.learningPathStatus,
    collegeId: lesson.collegeId,
    organizationId: lesson.organizationId,
  };
}

export async function loadQuizAttemptScope(
  attemptId: string,
) {
  const [attempt] = await getDb()
    .select()
    .from(quizAttempts)
    .where(eq(quizAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    throw new CoursesServiceError(
      "QUIZ_ATTEMPT_NOT_FOUND",
    );
  }

  const quiz = await loadCourseQuizScope(
    attempt.quizId,
    true,
  );
  const delivery =
    await loadCourseSectionDeliveryScope(
      attempt.deliveryId,
      true,
    );

  if (
    delivery.offeringId !== quiz.offeringId ||
    (quiz.deliveryId &&
      quiz.deliveryId !== delivery.id)
  ) {
    throw new CoursesServiceError(
      "QUIZ_DELIVERY_MISMATCH",
    );
  }

  return {
    ...attempt,
    quizStatus: quiz.status,
    quizResultsPublished:
      quiz.resultsPublished,
    maxAttempts: quiz.maxAttempts,
    collegeId: quiz.collegeId,
    organizationId: quiz.organizationId,
  };
}
