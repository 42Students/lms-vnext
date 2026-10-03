import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseQuizzes,
  quizAttempts,
  quizOptions,
  quizQuestions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
} from "./scope";
import { loadCourseQuizScope } from "./quiz-scope";
import {
  courseQuizIdSchema,
  createCourseQuizInputSchema,
  quizTransitionSchema,
  setQuizResultsInputSchema,
  updateCourseQuizInputSchema,
  type CreateCourseQuizInput,
  type UpdateCourseQuizInput,
} from "./quiz-validation";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
} from "./validation";

function mapQuizConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "course_quizzes_generic_active_name_uq":
    case "course_quizzes_delivery_active_name_uq":
      return new CoursesServiceError(
        "QUIZ_NAME_CONFLICT",
      );
    case "course_quizzes_generic_active_sequence_uq":
    case "course_quizzes_delivery_active_sequence_uq":
      return new CoursesServiceError(
        "QUIZ_SEQUENCE_CONFLICT",
      );
    default:
      return error;
  }
}

function totalPoints(
  questions: CreateCourseQuizInput["questions"],
) {
  return questions.reduce(
    (sum, question) => sum + question.points,
    0,
  );
}

async function authorizeQuizMutation(
  context: RequestContext,
  quiz: Awaited<
    ReturnType<typeof loadCourseQuizScope>
  >,
) {
  if (quiz.deliveryId) {
    await requireDeliveryContentMutation(
      context,
      quiz.deliveryId,
    );
    return;
  }

  requirePermission(context, "courses.manage", {
    organizationId: quiz.organizationId,
    collegeId: quiz.collegeId,
  });
}

async function insertQuestions(
  tx: Parameters<
    Parameters<
      ReturnType<typeof getDb>["transaction"]
    >[0]
  >[0],
  quizId: string,
  questions: CreateCourseQuizInput["questions"],
) {
  for (const questionInput of questions) {
    const [question] = await tx
      .insert(quizQuestions)
      .values({
        quizId,
        questionType: questionInput.type,
        prompt: questionInput.prompt,
        points: questionInput.points,
        sequence: questionInput.sequence,
      })
      .returning();

    await tx.insert(quizOptions).values(
      questionInput.options.map((option) => ({
        questionId: question.id,
        optionText: option.text,
        isCorrect: option.correct,
        sequence: option.sequence,
      })),
    );
  }
}

export async function listCourseQuizzes(
  context: RequestContext,
  lessonIdInput: string,
  deliveryIdInput?: string | null,
  includeArchived = false,
) {
  const lessonId =
    courseLessonIdSchema.parse(lessonIdInput);
  const deliveryId = deliveryIdInput
    ? courseSectionDeliveryIdSchema.parse(
        deliveryIdInput,
      )
    : null;
  const lesson = await loadCourseLessonScope(
    lessonId,
    includeArchived,
  );
  const access = await requireLearningReadAccess(
    context,
    lesson.offeringId,
    deliveryId,
  );

  if (
    access === "LEARNER" &&
    lesson.learningPathStatus !== "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_PUBLISHED",
    );
  }

  if (
    includeArchived &&
    !can(context, "courses.manage", {
      organizationId: lesson.organizationId,
      collegeId: lesson.collegeId,
    })
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const audience = deliveryId
    ? or(
        isNull(courseQuizzes.deliveryId),
        eq(courseQuizzes.deliveryId, deliveryId),
      )
    : isNull(courseQuizzes.deliveryId);

  const conditions = [
    eq(courseQuizzes.lessonId, lessonId),
    audience,
  ];

  if (access === "LEARNER") {
    conditions.push(
      inArray(courseQuizzes.status, [
        "PUBLISHED",
        "CLOSED",
      ]),
    );
  } else if (!includeArchived) {
    conditions.push(
      ne(courseQuizzes.status, "ARCHIVED"),
    );
  }

  return getDb()
    .select()
    .from(courseQuizzes)
    .where(and(...conditions))
    .orderBy(
      asc(courseQuizzes.sequence),
      asc(courseQuizzes.createdAt),
      asc(courseQuizzes.id),
    );
}

export async function getCourseQuiz(
  context: RequestContext,
  quizIdInput: string,
  deliveryIdInput?: string | null,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const deliveryId = deliveryIdInput
    ? courseSectionDeliveryIdSchema.parse(
        deliveryIdInput,
      )
    : null;
  const quiz = await loadCourseQuizScope(quizId);
  const access = await requireLearningReadAccess(
    context,
    quiz.offeringId,
    deliveryId,
  );

  if (
    access === "LEARNER" &&
    (!["PUBLISHED", "CLOSED"].includes(
      quiz.status,
    ) ||
      quiz.learningPathStatus !== "PUBLISHED")
  ) {
    throw new CoursesServiceError(
      "QUIZ_NOT_PUBLISHED",
    );
  }

  if (
    deliveryId &&
    quiz.deliveryId &&
    quiz.deliveryId !== deliveryId
  ) {
    throw new CoursesServiceError(
      "QUIZ_DELIVERY_MISMATCH",
    );
  }

  let attemptCount = 0;
  if (access === "LEARNER") {
    if (!context.membership || !deliveryId) {
      throw new CoursesServiceError(
        "LEARNING_ACCESS_DENIED",
      );
    }

    const [countRow] = await getDb()
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(
            quizAttempts.membershipId,
            context.membership.id,
          ),
        ),
      );
    attemptCount = countRow?.count ?? 0;
  }

  const questions = await getDb()
    .select({
      id: quizQuestions.id,
      questionType: quizQuestions.questionType,
      prompt: quizQuestions.prompt,
      points: quizQuestions.points,
      sequence: quizQuestions.sequence,
      optionId: quizOptions.id,
      optionText: quizOptions.optionText,
      optionCorrect: quizOptions.isCorrect,
      optionSequence: quizOptions.sequence,
    })
    .from(quizQuestions)
    .innerJoin(
      quizOptions,
      eq(quizOptions.questionId, quizQuestions.id),
    )
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(
      asc(quizQuestions.sequence),
      asc(quizOptions.sequence),
      asc(quizOptions.id),
    );

  const revealCorrect =
    access !== "LEARNER" ||
    (quiz.status === "CLOSED" &&
      quiz.resultsPublished &&
      attemptCount > 0);

  const grouped = new Map<
    string,
    {
      id: string;
      type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
      prompt: string;
      points: number;
      sequence: number;
      options: Array<{
        id: string;
        text: string;
        sequence: number;
        correct?: boolean;
      }>;
    }
  >();

  for (const row of questions) {
    let question = grouped.get(row.id);
    if (!question) {
      question = {
        id: row.id,
        type: row.questionType,
        prompt: row.prompt,
        points: row.points,
        sequence: row.sequence,
        options: [],
      };
      grouped.set(row.id, question);
    }

    question.options.push({
      id: row.optionId,
      text: row.optionText,
      sequence: row.optionSequence,
      ...(revealCorrect
        ? { correct: row.optionCorrect }
        : {}),
    });
  }

  return {
    quiz,
    attemptsUsed:
      access === "LEARNER"
        ? attemptCount
        : null,
    attemptsRemaining:
      access === "LEARNER"
        ? Math.max(
            0,
            quiz.maxAttempts - attemptCount,
          )
        : null,
    resultsVisible:
      access === "LEARNER"
        ? revealCorrect
        : true,
    questions: [...grouped.values()],
  };
}

export async function createCourseQuiz(
  context: RequestContext,
  rawInput: CreateCourseQuizInput,
) {
  const input =
    createCourseQuizInputSchema.parse(rawInput);
  const lesson = await loadCourseLessonScope(
    input.lessonId,
  );

  if (input.deliveryId) {
    const delivery =
      await loadCourseSectionDeliveryScope(
        input.deliveryId,
      );

    if (
      delivery.offeringId !== lesson.offeringId
    ) {
      throw new CoursesServiceError(
        "QUIZ_DELIVERY_MISMATCH",
      );
    }

    await requireDeliveryContentMutation(
      context,
      input.deliveryId,
    );
  } else {
    requirePermission(context, "courses.manage", {
      organizationId: lesson.organizationId,
      collegeId: lesson.collegeId,
    });
  }

  try {
    return await getDb().transaction(
      async (tx) => {
        const [quiz] = await tx
          .insert(courseQuizzes)
          .values({
            lessonId: input.lessonId,
            deliveryId:
              input.deliveryId ?? null,
            title: input.title,
            description:
              input.description ?? null,
            dueAt: input.dueAt
              ? new Date(input.dueAt)
              : null,
            maxAttempts: input.maxAttempts,
            totalPoints: totalPoints(
              input.questions,
            ),
            sequence: input.sequence,
            createdByUserId: context.user.id,
          })
          .returning();

        await insertQuestions(
          tx,
          quiz.id,
          input.questions,
        );

        return quiz;
      },
    );
  } catch (error) {
    throw mapQuizConstraint(error);
  }
}

export async function updateCourseQuiz(
  context: RequestContext,
  quizIdInput: string,
  rawInput: UpdateCourseQuizInput,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const input =
    updateCourseQuizInputSchema.parse(rawInput);
  const current =
    await loadCourseQuizScope(quizId);

  await authorizeQuizMutation(
    context,
    current,
  );

  const [attemptStats] = await getDb()
    .select({
      count: sql<number>`count(*)::int`,
      maxAttempt:
        sql<number | null>`max(${quizAttempts.attemptNumber})::int`,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.quizId, quizId));

  const attemptCount = attemptStats?.count ?? 0;
  const maxAttempt =
    attemptStats?.maxAttempt ?? 0;

  if (
    input.questions &&
    (current.status !== "DRAFT" ||
      attemptCount > 0)
  ) {
    throw new CoursesServiceError(
      "QUIZ_HAS_ATTEMPTS",
    );
  }

  if (
    input.maxAttempts !== undefined &&
    attemptCount > 0 &&
    input.maxAttempts !== current.maxAttempts
  ) {
    throw new CoursesServiceError(
      "QUIZ_HAS_ATTEMPTS",
    );
  }

  if (
    input.maxAttempts !== undefined &&
    input.maxAttempts < maxAttempt
  ) {
    throw new CoursesServiceError(
      "QUIZ_MAX_ATTEMPTS_REACHED",
    );
  }

  try {
    return await getDb().transaction(
      async (tx) => {
        if (input.questions) {
          const questionRows = await tx
            .select({ id: quizQuestions.id })
            .from(quizQuestions)
            .where(
              eq(quizQuestions.quizId, quizId),
            );

          if (questionRows.length > 0) {
            const questionIds =
              questionRows.map((row) => row.id);
            await tx
              .delete(quizOptions)
              .where(
                inArray(
                  quizOptions.questionId,
                  questionIds,
                ),
              );
            await tx
              .delete(quizQuestions)
              .where(
                eq(
                  quizQuestions.quizId,
                  quizId,
                ),
              );
          }

          await insertQuestions(
            tx,
            quizId,
            input.questions,
          );
        }

        const [updated] = await tx
          .update(courseQuizzes)
          .set({
            ...(input.title !== undefined
              ? { title: input.title }
              : {}),
            ...(input.description !== undefined
              ? {
                  description:
                    input.description,
                }
              : {}),
            ...(input.dueAt !== undefined
              ? {
                  dueAt: input.dueAt
                    ? new Date(input.dueAt)
                    : null,
                }
              : {}),
            ...(input.maxAttempts !== undefined
              ? {
                  maxAttempts:
                    input.maxAttempts,
                }
              : {}),
            ...(input.sequence !== undefined
              ? { sequence: input.sequence }
              : {}),
            ...(input.questions
              ? {
                  totalPoints: totalPoints(
                    input.questions,
                  ),
                }
              : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(courseQuizzes.id, quizId),
              ne(
                courseQuizzes.status,
                "ARCHIVED",
              ),
            ),
          )
          .returning();

        if (!updated) {
          throw new CoursesServiceError(
            "QUIZ_NOT_FOUND",
          );
        }

        return updated;
      },
    );
  } catch (error) {
    if (error instanceof CoursesServiceError) {
      throw error;
    }
    throw mapQuizConstraint(error);
  }
}

export async function transitionCourseQuiz(
  context: RequestContext,
  quizIdInput: string,
  rawInput: unknown,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const input =
    quizTransitionSchema.parse(rawInput);
  const current =
    await loadCourseQuizScope(quizId);

  await authorizeQuizMutation(
    context,
    current,
  );

  if (
    input.action === "PUBLISH" &&
    current.status !== "DRAFT"
  ) {
    throw new CoursesServiceError(
      "INVALID_QUIZ_TRANSITION",
    );
  }

  if (
    input.action === "CLOSE" &&
    current.status !== "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "INVALID_QUIZ_TRANSITION",
    );
  }

  if (
    input.action === "PUBLISH" &&
    current.dueAt &&
    current.dueAt.getTime() <= Date.now()
  ) {
    throw new CoursesServiceError(
      "QUIZ_DEADLINE_PASSED",
    );
  }

  const nextStatus =
    input.action === "PUBLISH"
      ? "PUBLISHED"
      : input.action === "CLOSE"
        ? "CLOSED"
        : "ARCHIVED";

  const [updated] = await getDb()
    .update(courseQuizzes)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courseQuizzes.id, quizId),
        ne(courseQuizzes.status, "ARCHIVED"),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "QUIZ_NOT_FOUND",
    );
  }

  return updated;
}

export async function setCourseQuizResults(
  context: RequestContext,
  quizIdInput: string,
  rawInput: unknown,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const input =
    setQuizResultsInputSchema.parse(rawInput);
  const current =
    await loadCourseQuizScope(
      quizId,
      true,
    );

  await authorizeQuizMutation(
    context,
    current,
  );

  if (
    input.published &&
    current.status !== "CLOSED"
  ) {
    throw new CoursesServiceError(
      "INVALID_QUIZ_TRANSITION",
    );
  }

  const [updated] = await getDb()
    .update(courseQuizzes)
    .set({
      resultsPublished: input.published,
      updatedAt: new Date(),
    })
    .where(eq(courseQuizzes.id, quizId))
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "QUIZ_NOT_FOUND",
    );
  }

  return updated;
}
