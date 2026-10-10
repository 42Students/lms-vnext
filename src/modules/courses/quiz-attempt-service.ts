import {
  and,
  asc,
  eq,
  inArray,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseQuizzes,
  quizAttemptAnswers,
  quizAttempts,
  quizOptions,
  quizQuestions,
  collegeMemberships,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import { loadCourseQuizScope } from "./quiz-scope";
import {
  courseQuizIdSchema,
  submitQuizInputSchema,
  type SubmitQuizInput,
} from "./quiz-validation";
import {
  courseSectionDeliveryIdSchema,
} from "./validation";
import {
  loadCourseSectionDeliveryScope,
} from "./scope";

type QuizQuestionRow = {
  id: string;
  questionType:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE";
  prompt: string;
  points: number;
  sequence: number;
  options: Array<{
    id: string;
    text: string;
    correct: boolean;
    sequence: number;
  }>;
};

function quizAudienceMatches(
  quiz: Awaited<
    ReturnType<typeof loadCourseQuizScope>
  >,
  deliveryId: string,
) {
  return (
    !quiz.deliveryId ||
    quiz.deliveryId === deliveryId
  );
}

async function loadQuizQuestions(
  quizId: string,
) {
  const rows = await getDb()
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

  const grouped = new Map<
    string,
    QuizQuestionRow
  >();

  for (const row of rows) {
    let question = grouped.get(row.id);
    if (!question) {
      question = {
        id: row.id,
        questionType: row.questionType,
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
      correct: row.optionCorrect,
      sequence: row.optionSequence,
    });
  }

  return [...grouped.values()];
}

async function requireLearnerQuizAccess(
  context: RequestContext,
  quiz: Awaited<
    ReturnType<typeof loadCourseQuizScope>
  >,
  deliveryId: string,
) {
  if (
    quiz.status !== "PUBLISHED" ||
    quiz.learningPathStatus !== "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "QUIZ_NOT_PUBLISHED",
    );
  }

  if (!quizAudienceMatches(quiz, deliveryId)) {
    throw new CoursesServiceError(
      "QUIZ_DELIVERY_MISMATCH",
    );
  }

  const access = await requireLearningReadAccess(
    context,
    quiz.offeringId,
    deliveryId,
  );

  if (
    access !== "LEARNER" ||
    !context.membership
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  return context.membership;
}

function scoreSubmission(
  questions: QuizQuestionRow[],
  input: SubmitQuizInput,
) {
  const answers = new Map(
    input.answers.map((answer) => [
      answer.questionId,
      answer.selectedOptionIds,
    ]),
  );
  const questionIds = new Set(
    questions.map((question) => question.id),
  );

  for (const submitted of input.answers) {
    if (!questionIds.has(submitted.questionId)) {
      throw new CoursesServiceError(
        "QUIZ_ANSWER_INVALID",
      );
    }
  }

  let score = 0;
  const answerRows = questions.map(
    (question) => {
      const selected =
        answers.get(question.id) ?? [];
      const selectedSet = new Set(selected);
      const validIds = new Set(
        question.options.map(
          (option) => option.id,
        ),
      );

      for (const optionId of selectedSet) {
        if (!validIds.has(optionId)) {
          throw new CoursesServiceError(
            "QUIZ_ANSWER_INVALID",
          );
        }
      }

      if (
        question.questionType ===
          "SINGLE_CHOICE" &&
        selected.length > 1
      ) {
        throw new CoursesServiceError(
          "QUIZ_ANSWER_INVALID",
        );
      }

      const correctIds = new Set(
        question.options
          .filter((option) => option.correct)
          .map((option) => option.id),
      );

      const correct =
        selectedSet.size > 0 &&
        selectedSet.size ===
          correctIds.size &&
        [...selectedSet].every((id) =>
          correctIds.has(id),
        );
      const pointsAwarded = correct
        ? question.points
        : 0;
      score += pointsAwarded;

      return {
        questionId: question.id,
        questionType:
          question.questionType,
        promptSnapshot: question.prompt,
        pointsPossible: question.points,
        selectedOptionIds: selected,
        optionsSnapshot:
          question.options.map((option) => ({
            id: option.id,
            text: option.text,
            sequence: option.sequence,
            correct: option.correct,
          })),
        correct,
        pointsAwarded,
      };
    },
  );

  return { score, answerRows };
}

async function currentAttemptCount(
  quizId: string,
  membershipId: string,
) {
  const [row] = await getDb()
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.quizId, quizId),
        eq(
          quizAttempts.membershipId,
          membershipId,
        ),
      ),
    );

  return row?.count ?? 0;
}

export async function submitCourseQuiz(
  context: RequestContext,
  quizIdInput: string,
  rawInput: SubmitQuizInput,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const input =
    submitQuizInputSchema.parse(rawInput);
  const quiz = await loadCourseQuizScope(quizId);
  const membership =
    await requireLearnerQuizAccess(
      context,
      quiz,
      input.deliveryId,
    );

  // Quiz content is immutable after publish. Validate answers against the
  // authored question/option set before opening a write transaction.
  const questions = await loadQuizQuestions(quizId);

  if (questions.length === 0) {
    throw new CoursesServiceError(
      "QUIZ_QUESTION_INVALID",
    );
  }

  const { score, answerRows } =
    scoreSubmission(questions, input);

  try {
    return await getDb().transaction(
      async (tx) => {
        // Serialize attempts per quiz across workers. A concurrent faculty
        // CLOSE/update or a second learner submission updates/locks this same
        // row, so neither a deadline change nor a max-attempt change can race
        // with the counted insert.
        const [lockedQuiz] = await tx
          .select({
            status: courseQuizzes.status,
            dueAt: courseQuizzes.dueAt,
            maxAttempts: courseQuizzes.maxAttempts,
            totalPoints: courseQuizzes.totalPoints,
            deliveryId: courseQuizzes.deliveryId,
          })
          .from(courseQuizzes)
          .where(eq(courseQuizzes.id, quizId))
          .for("update")
          .limit(1);

        if (!lockedQuiz || lockedQuiz.status !== "PUBLISHED") {
          throw new CoursesServiceError("QUIZ_NOT_PUBLISHED");
        }
        if (lockedQuiz.deliveryId &&
            lockedQuiz.deliveryId !== input.deliveryId) {
          throw new CoursesServiceError("QUIZ_DELIVERY_MISMATCH");
        }
        if (lockedQuiz.dueAt &&
            lockedQuiz.dueAt.getTime() < Date.now()) {
          throw new CoursesServiceError("QUIZ_DEADLINE_PASSED");
        }

        // Recheck actor against persisted membership, not just request JWT
        // claims. A role revocation or transfer must fail closed.
        const [persistedMember] = await tx
          .select({
            userId: collegeMemberships.userId,
            collegeId: collegeMemberships.collegeId,
            status: collegeMemberships.status,
          })
          .from(collegeMemberships)
          .where(eq(collegeMemberships.id, membership.id))
          .for("share")
          .limit(1);
        if (!persistedMember ||
            persistedMember.status !== "ACTIVE" ||
            persistedMember.userId !== context.user.id ||
            persistedMember.collegeId !== membership.collegeId ||
            context.user.platformStatus !== "ACTIVE") {
          throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
        }

        const [countRow] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(quizAttempts)
          .where(and(
            eq(quizAttempts.quizId, quizId),
            eq(quizAttempts.membershipId, membership.id),
          ));
        const attemptsUsed = countRow?.count ?? 0;
        if (attemptsUsed >= lockedQuiz.maxAttempts) {
          throw new CoursesServiceError("QUIZ_MAX_ATTEMPTS_REACHED");
        }
        const [attempt] = await tx
          .insert(quizAttempts)
          .values({
            quizId,
            deliveryId: input.deliveryId,
            membershipId: membership.id,
            attemptNumber: attemptsUsed + 1,
            score,
            maxScore: lockedQuiz.totalPoints,
          })
          .returning();

        await tx.insert(quizAttemptAnswers).values(
          answerRows.map((answer) => ({
            attemptId: attempt.id,
            ...answer,
          })),
        );

        return {
          ...attempt,
          resultsVisible: false,
          score: null,
          maxScore: null,
          answers: [],
        };
      },
    );
  } catch (error) {
    if (
      postgresConstraintName(error) ===
      "quiz_attempts_quiz_membership_number_uq"
    ) {
      const latestCount =
        await currentAttemptCount(
          quizId,
          membership.id,
        );

      throw new CoursesServiceError(
        latestCount >= quiz.maxAttempts
          ? "QUIZ_MAX_ATTEMPTS_REACHED"
          : "QUIZ_ATTEMPT_CONFLICT",
      );
    }

    throw error;
  }
}

function mayRevealLearnerResults(
  quiz: Awaited<
    ReturnType<typeof loadCourseQuizScope>
  >,
  attemptsUsed: number,
) {
  return (
    quiz.status === "CLOSED" &&
    quiz.resultsPublished &&
    attemptsUsed > 0
  );
}

export async function getMyQuizAttempts(
  context: RequestContext,
  quizIdInput: string,
  deliveryIdInput: string,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const quiz = await loadCourseQuizScope(
    quizId,
    true,
  );

  if (!quizAudienceMatches(quiz, deliveryId)) {
    throw new CoursesServiceError(
      "QUIZ_DELIVERY_MISMATCH",
    );
  }

  const access = await requireLearningReadAccess(
    context,
    quiz.offeringId,
    deliveryId,
  );

  if (
    access !== "LEARNER" ||
    !context.membership
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const attempts = await getDb()
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.quizId, quizId),
        eq(
          quizAttempts.membershipId,
          context.membership.id,
        ),
      ),
    )
    .orderBy(
      asc(quizAttempts.attemptNumber),
    );

  const reveal = mayRevealLearnerResults(
    quiz,
    attempts.length,
  );

  const answerRows =
    attempts.length > 0
      ? await getDb()
          .select()
          .from(quizAttemptAnswers)
          .where(
            inArray(
              quizAttemptAnswers.attemptId,
              attempts.map(
                (attempt) => attempt.id,
              ),
            ),
          )
          .orderBy(
            asc(quizAttemptAnswers.createdAt),
          )
      : [];

  const byAttempt = new Map<
    string,
    typeof answerRows
  >();
  for (const answer of answerRows) {
    const bucket =
      byAttempt.get(answer.attemptId) ?? [];
    bucket.push(answer);
    byAttempt.set(answer.attemptId, bucket);
  }

  return attempts.map((attempt) => ({
    ...attempt,
    score: reveal ? attempt.score : null,
    maxScore: reveal
      ? attempt.maxScore
      : null,
    resultsVisible: reveal,
    answers: (byAttempt.get(attempt.id) ?? []).map(
      (answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        questionType:
          answer.questionType,
        prompt: answer.promptSnapshot,
        pointsPossible:
          answer.pointsPossible,
        selectedOptionIds:
          answer.selectedOptionIds,
        ...(reveal
          ? {
              correct: answer.correct,
              pointsAwarded:
                answer.pointsAwarded,
              options:
                answer.optionsSnapshot,
            }
          : {}),
      }),
    ),
  }));
}

export async function listQuizAttempts(
  context: RequestContext,
  quizIdInput: string,
  deliveryIdInput: string,
) {
  const quizId =
    courseQuizIdSchema.parse(quizIdInput);
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const [quiz, delivery] =
    await Promise.all([
      loadCourseQuizScope(quizId, true),
      loadCourseSectionDeliveryScope(
        deliveryId,
        true,
      ),
    ]);

  if (
    delivery.offeringId !== quiz.offeringId ||
    !quizAudienceMatches(quiz, deliveryId)
  ) {
    throw new CoursesServiceError(
      "QUIZ_DELIVERY_MISMATCH",
    );
  }

  if (
    can(context, "courses.manage", {
      organizationId: quiz.organizationId,
      collegeId: quiz.collegeId,
    })
  ) {
    // Tenant admin may review all delivery attempts.
  } else {
    await requireDeliveryContentMutation(
      context,
      deliveryId,
    );
  }

  const attempts = await getDb()
    .select({
      id: quizAttempts.id,
      quizId: quizAttempts.quizId,
      deliveryId: quizAttempts.deliveryId,
      membershipId:
        quizAttempts.membershipId,
      attemptNumber:
        quizAttempts.attemptNumber,
      score: quizAttempts.score,
      maxScore: quizAttempts.maxScore,
      submittedAt: quizAttempts.submittedAt,
      createdAt: quizAttempts.createdAt,
      learnerDisplayName: users.displayName,
      learnerEmail: users.email,
    })
    .from(quizAttempts)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        quizAttempts.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .where(
      and(
        eq(quizAttempts.quizId, quizId),
        eq(
          quizAttempts.deliveryId,
          deliveryId,
        ),
      ),
    )
    .orderBy(
      asc(quizAttempts.submittedAt),
      asc(quizAttempts.id),
    );

  const answerRows =
    attempts.length > 0
      ? await getDb()
          .select()
          .from(quizAttemptAnswers)
          .where(
            inArray(
              quizAttemptAnswers.attemptId,
              attempts.map(
                (attempt) => attempt.id,
              ),
            ),
          )
          .orderBy(
            asc(quizAttemptAnswers.createdAt),
          )
      : [];

  const byAttempt = new Map<
    string,
    typeof answerRows
  >();
  for (const answer of answerRows) {
    const bucket =
      byAttempt.get(answer.attemptId) ?? [];
    bucket.push(answer);
    byAttempt.set(answer.attemptId, bucket);
  }

  return attempts.map((attempt) => ({
    ...attempt,
    answers:
      byAttempt.get(attempt.id) ?? [],
  }));
}
