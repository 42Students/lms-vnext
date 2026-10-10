import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import { listAssignmentSubmissions } from "./assignment-submission-service";
import { listQuizAttempts } from "./quiz-attempt-service";

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
    row.score !== null && row.maxScore !== null && row.maxScore > 0,
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
  const attempts = await listQuizAttempts(context, quizId, quiz.deliveryId);
  const learners = new Set(attempts.map((attempt) => attempt.membershipId));
  return {
    quiz,
    attempts,
    metrics: {
      ...scoreSummary(attempts),
      uniqueLearners: learners.size,
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
  const submissions = await listAssignmentSubmissions(
    context,
    assignmentId,
    assignment.deliveryId,
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
    metrics: {
      submitted: submissions.length,
      late: late.length,
      graded: graded.length,
      gradePublished: submissions.filter((item) => item.gradePublished).length,
      // Roster of non-submitters is not part of the submission model and
      // requires an enrollment-aware separate query before claiming parity.
      missingLearners: null,
    },
  };
}
