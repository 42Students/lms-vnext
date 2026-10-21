import { shuffleQuizForLearner } from "./learner-quiz-shuffle-model";
import {learnerQuizResultsReleased} from "./learner-quiz-result-release-policy";
import { commandFacultyQuiz } from "./faculty-quiz-authoring-service";
import { facultyQuizLegacyEdit } from "./faculty-quiz-authoring-model";
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
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {legacyQuizResultsWriteAllowed} from "./faculty-quiz-results-legacy-model";
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
    return requireDeliveryContentMutation(
      context,
      quiz.deliveryId,
    );
  }

  requirePermission(context, "courses.manage", {
    organizationId: quiz.organizationId,
    collegeId: quiz.collegeId,
  });
  return "ADMIN" as const;
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

  // COL-course-tabs-13: hidden lessons are unavailable even by a saved deep link.
  if (access === "LEARNER" && !lesson.visibleToStudents) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }

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

  if (access === "LEARNER" && !quiz.lessonVisibleToStudents) {
    throw new CoursesServiceError("QUIZ_NOT_PUBLISHED");
  }
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

  const revealCorrect = access !== "LEARNER" ||
    learnerQuizResultsReleased(quiz,Date.now());

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
    questions:access==="LEARNER"&&context.membership
      ? shuffleQuizForLearner([...grouped.values()],quizId,context.membership.id,
          quiz.shuffleQuestions,quiz.shuffleOptions)
      : [...grouped.values()],
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
            shuffleQuestions:input.shuffleQuestions,
            shuffleOptions:input.shuffleOptions,
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

  const actor = await authorizeQuizMutation(
    context,
    current,
  );

  if (actor === "FACULTY" && current.deliveryId) {
    return commandFacultyQuiz(context,{deliveryId:current.deliveryId},facultyQuizLegacyEdit(current,input));
  }

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
  // FAC-assessments-R02: deadlines cannot move after attempts or closure.
  const changesDeadline = input.dueAt !== undefined &&
    (input.dueAt ? new Date(input.dueAt).getTime() : null) !==
      (current.dueAt?.getTime() ?? null);
  if(changesDeadline && (attemptCount>0 || current.status==="CLOSED"))
    throw new CoursesServiceError("QUIZ_DEADLINE_LOCKED");

  if(current.status!=="DRAFT" && (
    (input.shuffleQuestions!==undefined&&input.shuffleQuestions!==current.shuffleQuestions)||
    (input.shuffleOptions!==undefined&&input.shuffleOptions!==current.shuffleOptions)
  ))throw new CoursesServiceError("QUIZ_RANDOMIZATION_LOCKED");

  if (
    input.questions &&
    (current.status !== "DRAFT" ||
      attemptCount > 0)
  ) {
    throw new CoursesServiceError(
      "QUIZ_QUESTIONS_LOCKED",
    );
  }

  if (
    input.maxAttempts !== undefined &&
    attemptCount > 0 &&
    input.maxAttempts !== current.maxAttempts
  ) {
    throw new CoursesServiceError(
      "QUIZ_ATTEMPT_LIMIT_LOCKED",
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
        // Serialize deadline checks with quiz attempt inserts and lifecycle writes.
        const [lockedQuiz]=await tx.select().from(courseQuizzes).where(eq(courseQuizzes.id,quizId))
          .for("update").limit(1);
        if(!lockedQuiz||lockedQuiz.status==="ARCHIVED")throw new CoursesServiceError("QUIZ_NOT_FOUND");
        if(input.expectedUpdatedAt&&new Date(input.expectedUpdatedAt).getTime()!==lockedQuiz.updatedAt.getTime())
          throw new CoursesServiceError("FACULTY_QUIZ_STALE_VERSION");
        const [liveAttemptStats]=await tx.select({
          count:sql<number>`count(*)::int`,
          maxAttempt:sql<number>`coalesce(max(${quizAttempts.attemptNumber}),0)::int`,
        }).from(quizAttempts).where(eq(quizAttempts.quizId,quizId));
        const liveAttempts=liveAttemptStats?.count??0;
        if(input.dueAt!==undefined && (
          (lockedQuiz.dueAt?.getTime()??null)!==
           (input.dueAt?new Date(input.dueAt).getTime():null))) {
          const [attempt]=await tx.select({id:quizAttempts.id})
           .from(quizAttempts).where(eq(quizAttempts.quizId,quizId)).limit(1);
          if(attempt || lockedQuiz.status==="CLOSED")
            throw new CoursesServiceError("QUIZ_HAS_ATTEMPTS");
        }
        if(input.questions&&(lockedQuiz.status!=="DRAFT"||liveAttempts>0))
          throw new CoursesServiceError("QUIZ_HAS_ATTEMPTS");
        if(lockedQuiz.status!=="DRAFT"&&(
          (input.shuffleQuestions!==undefined&&input.shuffleQuestions!==lockedQuiz.shuffleQuestions)||
          (input.shuffleOptions!==undefined&&input.shuffleOptions!==lockedQuiz.shuffleOptions)
        ))throw new CoursesServiceError("QUIZ_HAS_ATTEMPTS");
        if(input.maxAttempts!==undefined&&liveAttempts>0&&input.maxAttempts!==lockedQuiz.maxAttempts)
          throw new CoursesServiceError("QUIZ_HAS_ATTEMPTS");
        if(input.maxAttempts!==undefined&&input.maxAttempts<(liveAttemptStats?.maxAttempt??0))
          throw new CoursesServiceError("QUIZ_MAX_ATTEMPTS_REACHED");
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
            ...(input.shuffleQuestions!==undefined?{shuffleQuestions:input.shuffleQuestions}:{}),
            ...(input.shuffleOptions!==undefined?{shuffleOptions:input.shuffleOptions}:{}),
            ...(input.questions
              ? {
                  totalPoints: totalPoints(
                    input.questions,
                  ),
                }
              : {}),
            updatedAt: new Date(Math.max(Date.now(),lockedQuiz.updatedAt.getTime()+1)),
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

  const actor = await authorizeQuizMutation(
    context,
    current,
  );

  if (actor === "FACULTY" && current.deliveryId) {
    return commandFacultyQuiz(context,{deliveryId:current.deliveryId},{
      action:input.action,quizId:current.id,
      expectedUpdatedAt:input.expectedUpdatedAt,confirmed:input.confirmed,
    });
  }

  if (
    input.action === "PUBLISH" &&
    current.status !== "DRAFT"
  ) {
    throw new CoursesServiceError(
      "INVALID_QUIZ_TRANSITION",
    );
  }

  if (input.action === "UNPUBLISH" && current.status !== "PUBLISHED")
    throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");

  if (
    input.action === "CLOSE" &&
    current.status !== "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "INVALID_QUIZ_TRANSITION",
    );
  }

  if (input.action === "PUBLISH") {
    if (!current.dueAt) throw new CoursesServiceError("QUIZ_DEADLINE_NOT_CONFIGURED");
    if (current.dueAt.getTime() <= Date.now())
      throw new CoursesServiceError("QUIZ_DEADLINE_PASSED");
  }

  const nextStatus =
    input.action === "PUBLISH"
      ? "PUBLISHED"
      : input.action === "UNPUBLISH" ? "DRAFT"
      : input.action === "CLOSE"
        ? "CLOSED"
        : "ARCHIVED";

  // Serialize with learner attempt insertion and preserve a reversible
  // PUBLISHED -> DRAFT transition only before submissions and the deadline.
  const updated = await getDb().transaction(async tx => {
    const [locked] = await tx.select().from(courseQuizzes)
      .where(eq(courseQuizzes.id,quizId)).for("update").limit(1);
    if (!locked || locked.status !== current.status)
      throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");
    if (input.action === "UNPUBLISH") {
      const [attempt] = await tx.select({id:quizAttempts.id}).from(quizAttempts)
        .where(eq(quizAttempts.quizId,quizId)).limit(1);
      if (attempt || !locked.dueAt || locked.dueAt.getTime() <= Date.now() ||
          locked.resultsPublished)
        throw new CoursesServiceError("QUIZ_UNPUBLISH_LOCKED");
    }
    if (input.action === "PUBLISH") {
      if (!locked.dueAt) throw new CoursesServiceError("QUIZ_DEADLINE_NOT_CONFIGURED");
      if (locked.dueAt.getTime() <= Date.now())
        throw new CoursesServiceError("QUIZ_DEADLINE_PASSED");
      const [question] = await tx.select({id:quizQuestions.id}).from(quizQuestions)
        .where(eq(quizQuestions.quizId,quizId)).limit(1);
      if (!question || locked.totalPoints <= 0)
        throw new CoursesServiceError("QUIZ_QUESTION_INVALID");
    }
    const [changed] = await tx.update(courseQuizzes)
      .set({status:nextStatus,updatedAt:new Date(Math.max(Date.now(),locked.updatedAt.getTime()+1))})
      .where(and(eq(courseQuizzes.id,quizId),eq(courseQuizzes.status,locked.status)))
      .returning();
    if (!changed) throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");
    return changed;
  });

  return updated;
}

export async function setCourseQuizResults(
  context:RequestContext,quizIdInput:string,rawInput:unknown,
) {
  const quizId=courseQuizIdSchema.parse(quizIdInput);
  const input=setQuizResultsInputSchema.parse(rawInput);
  const current=await loadCourseQuizScope(quizId,true);
  const actor=await authorizeQuizMutation(context,current);
  const manage=can(context,"courses.manage",{
    collegeId:current.collegeId,organizationId:current.organizationId,
  });
  const authorized=manage||(actor==="FACULTY"&&current.deliveryId!==null);
  if(!authorized)throw new CoursesServiceError("QUIZ_RESULTS_ADMIN_ONLY");
  return getDb().transaction(async tx=>{
    const [locked]=await tx.select().from(courseQuizzes)
      .where(eq(courseQuizzes.id,quizId)).for("update").limit(1);
    if(!locked)throw new CoursesServiceError("QUIZ_NOT_FOUND");
    const dueIsPast=locked.dueAt!==null && locked.dueAt.getTime()<=Date.now();
    const eligibleStatus=input.published
      ? dueIsPast && (locked.status==="CLOSED"||locked.status==="PUBLISHED")
      : locked.status==="CLOSED";
    if(!eligibleStatus || !legacyQuizResultsWriteAllowed(authorized,"CLOSED",
      locked.resultsPublished,input.published))
      throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");
    const now=new Date(Math.max(Date.now(),locked.updatedAt.getTime()+1));
    const [updated]=await tx.update(courseQuizzes).set({
      resultsPublished:input.published,status:"CLOSED",updatedAt:now,
    }).where(and(eq(courseQuizzes.id,quizId),eq(courseQuizzes.status,locked.status),
      eq(courseQuizzes.resultsPublished,!input.published))).returning();
    if(!updated)throw new CoursesServiceError("INVALID_QUIZ_TRANSITION");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.COURSES_QUIZ_RESULTS_CHANGED,
      collegeId:current.collegeId,organizationId:current.organizationId,
      subjectType:"course_quiz",subjectId:quizId,subjectLabel:locked.title,
      summary:input.published?"Admin Quiz results published":"Admin Quiz results hidden",
      groupKey:"course-quiz:"+quizId+":results",
      metadata:{quizId,deliveryId:locked.deliveryId,resultsPublished:input.published},
    });
    return updated;
  });
}
