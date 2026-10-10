import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import { listAssignmentSubmissions } from "./assignment-submission-service";
import { listQuizAttempts } from "./quiz-attempt-service";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";

const uuid = z.string().uuid();

function resolveReportScope<T extends { id: string; deliveryId: string }>(
  candidates: readonly T[],
  itemId: string,
  deliveryId: string | null,
  notFound: "QUIZ_NOT_FOUND" | "ASSIGNMENT_NOT_FOUND",
  mismatched: "QUIZ_DELIVERY_MISMATCH" | "ASSIGNMENT_DELIVERY_MISMATCH",
): T {
  const matching = candidates.filter((entry) =>
    entry.id === itemId && (!deliveryId || entry.deliveryId === deliveryId),
  );
  if (matching.length === 0) throw new CoursesServiceError(notFound);
  // A shared offering item can appear in multiple authorized Sections.
  // Refuse to produce misleading cross-section analytics without context.
  if (matching.length > 1) throw new CoursesServiceError(mismatched);
  return matching[0]!;
}

export function scoreSummary(
  rows: readonly { score: number | null; maxScore: number | null }[],
) {
  const graded = rows.filter((row) =>
    row.score !== null &&
    row.maxScore !== null &&
    Number.isFinite(row.score) &&
    Number.isFinite(row.maxScore) &&
    row.maxScore > 0 &&
    row.score >= 0 &&
    row.score <= row.maxScore,
  );
  const averagePercent = graded.length
    ? Math.round(
        graded.reduce(
          (sum, row) => sum + (row.score! / row.maxScore!) * 100,
          0,
        ) / graded.length,
      )
    : null;
  return { attempted: rows.length, graded: graded.length, averagePercent };
}

export async function getFacultyQuizReport(
  context: RequestContext,
  rawId: string,
  rawDeliveryId: string | null,
) {
  const quizId = uuid.parse(rawId);
  const deliveryId = rawDeliveryId ? uuid.parse(rawDeliveryId) : null;
  const overview = await getFacultyAssessmentOverview(context);
  const quiz = resolveReportScope(
    overview.quizzes,
    quizId,
    deliveryId,
    "QUIZ_NOT_FOUND",
    "QUIZ_DELIVERY_MISMATCH",
  );
  const [attempts, rosterScope] = await Promise.all([
    listQuizAttempts(context, quizId, quiz.deliveryId),
    getFacultyDeliveryRoster(context, quiz.deliveryId),
  ]);
  const learners = new Set(
    attempts.map((attempt) => attempt.membershipId),
  );
  const notAttemptedLearners =
    rosterScope.roster.filter(
      (learner) =>
        !learners.has(learner.membershipId),
    );
  return {
    quiz,
    attempts,
    notAttemptedLearners,
    metrics: {
      ...scoreSummary(attempts),
      eligibleLearners:
        rosterScope.roster.length,
      uniqueLearners: learners.size,
      notAttempted:
        notAttemptedLearners.length,
    },
  };
}

export async function getFacultyAssignmentReport(
  context: RequestContext,
  rawId: string,
  rawDeliveryId: string | null,
) {
  const assignmentId = uuid.parse(rawId);
  const deliveryId = rawDeliveryId ? uuid.parse(rawDeliveryId) : null;
  const overview = await getFacultyAssessmentOverview(context);
  const assignment = resolveReportScope(
    overview.assignments,
    assignmentId,
    deliveryId,
    "ASSIGNMENT_NOT_FOUND",
    "ASSIGNMENT_DELIVERY_MISMATCH",
  );
  const [submissions, rosterScope] =
    await Promise.all([
      listAssignmentSubmissions(
        context,
        assignmentId,
        assignment.deliveryId,
      ),
      getFacultyDeliveryRoster(
        context,
        assignment.deliveryId,
      ),
    ]);
  const submittedMemberships = new Set(
    submissions.map(
      (submission) => submission.membershipId,
    ),
  );
  const missingLearners =
    rosterScope.roster.filter(
      (learner) =>
        !submittedMemberships.has(
          learner.membershipId,
        ),
    );
  const graded = submissions.filter((submission) =>
    submission.gradingStatus === "GRADED",
  );
  const late = submissions.filter((submission) =>
    assignment.dueAt !== null &&
    submission.submittedAt.getTime() > assignment.dueAt.getTime(),
  );
  return {
    assignment,
    submissions,
    missingLearners,
    metrics: {
      eligibleLearners:
        rosterScope.roster.length,
      submitted: submissions.length,
      missing: missingLearners.length,
      late: late.length,
      graded: graded.length,
      gradePublished: submissions.filter(
        (item) => item.gradePublished,
      ).length,
    },
  };
}
