import { z } from "zod";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import { getFacultyAssessmentOverview } from "./faculty-assessment-service";
import { listAssignmentSubmissions } from "./assignment-submission-service";
import { listQuizAttempts } from "./quiz-attempt-service";
import { getCourseQuiz } from "./quiz-service";
import { getFacultyDeliveryRoster } from "@/modules/attendance/faculty-service";

const uuid = z.string().uuid();

/** Current-roster filtering is for current eligibility/absence only. Historic
 * submissions by an authorized learner on this delivery remain reportable even
 * after transfer; they must not be counted as currently missing. */
export function facultyReportCurrentRosterRows<T extends {membershipId:string}>(
  records:readonly T[],roster:readonly {membershipId:string}[],
):T[] {
  const permitted=new Set(roster.map(row=>row.membershipId));
  return records.filter(row=>permitted.has(row.membershipId));
}

export type ScoreDistributionBucket = {
  label: "90-100%" | "80-89%" | "70-79%" | "60-69%" | "Below 60%";
  min: number;
  max: number;
  count: number;
};

export function buildScoreDistribution(
  percentages: readonly number[],
): ScoreDistributionBucket[] {
  const buckets: ScoreDistributionBucket[] = [
    { label: "90-100%", min: 90, max: 100, count: 0 },
    { label: "80-89%", min: 80, max: 89, count: 0 },
    { label: "70-79%", min: 70, max: 79, count: 0 },
    { label: "60-69%", min: 60, max: 69, count: 0 },
    { label: "Below 60%", min: 0, max: 59, count: 0 },
  ];
  for (const percent of percentages) {
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) continue;
    // Fractional scores are common when questions have weighted points;
    // do not lose 89.5% between integer-labeled histogram buckets.
    const rounded = Math.round(percent);
    const bucket = buckets.find(
      (candidate) =>
        rounded >= candidate.min && rounded <= candidate.max,
    );
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function latestQuizAttemptsByLearner<
  T extends {
    membershipId: string;
    submittedAt: Date;
    attemptNumber: number;
  },
>(attempts: readonly T[]) {
  const latest = new Map<string, T>();
  for (const attempt of attempts) {
    const existing = latest.get(attempt.membershipId);
    if (
      !existing ||
      attempt.submittedAt.getTime() >
        existing.submittedAt.getTime() ||
      (attempt.submittedAt.getTime() ===
        existing.submittedAt.getTime() &&
        attempt.attemptNumber > existing.attemptNumber)
    ) {
      latest.set(attempt.membershipId, attempt);
    }
  }
  return [...latest.values()];
}

export function questionAccuracy<
  Q extends { id: string; prompt: string; points: number },
  A extends {
    answers: readonly {
      questionId: string;
      correct: boolean;
    }[];
  },
>(questions: readonly Q[], attempts: readonly A[]) {
  return questions
    .map((question) => {
      let answeredCount = 0;
      let correctCount = 0;
      for (const attempt of attempts) {
        const answer = attempt.answers.find(
          (candidate) =>
            candidate.questionId === question.id,
        );
        if (!answer) continue;
        answeredCount += 1;
        if (answer.correct) correctCount += 1;
      }
      return {
        id: question.id,
        prompt: question.prompt,
        points: question.points,
        answeredCount,
        correctCount,
        accuracyPercent:
          answeredCount > 0
            ? Math.round(
                (correctCount / answeredCount) * 100,
              )
            : null,
      };
    })
    .sort(
      (left, right) =>
        (left.accuracyPercent ?? 101) -
          (right.accuracyPercent ?? 101) ||
        left.prompt.localeCompare(right.prompt),
    );
}

export function assignmentScoreSummary(
  rows: readonly {
    pointsAwarded: number | null;
    gradingStatus: string;
  }[],
  maxPoints: number,
) {
  const percentages = rows.flatMap((row) => {
    if (
      row.pointsAwarded === null ||
      !Number.isFinite(row.pointsAwarded) ||
      !Number.isFinite(maxPoints) ||
      maxPoints <= 0 ||
      row.pointsAwarded < 0 ||
      row.pointsAwarded > maxPoints
    ) {
      return [];
    }
    return [Math.round(Math.min(100, (row.pointsAwarded / maxPoints) * 100))];
  });
  return {
    averagePercent:
      percentages.length > 0
        ? Math.round(
            percentages.reduce(
              (sum, percent) => sum + percent,
              0,
            ) / percentages.length,
          )
        : null,
    distribution:
      buildScoreDistribution(percentages),
  };
}

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
          (sum, row) => sum + Math.round((row.score! / row.maxScore!) * 100),
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
  const [attempts, rosterRead, authoredQuiz] =
    await Promise.all([
      listQuizAttempts(
        context,
        quizId,
        quiz.deliveryId,
      ),
      getFacultyDeliveryRoster(context, quiz.deliveryId)
        .then(value => ({ok:true as const,value}))
        .catch(() => ({ok:false as const})),
      getCourseQuiz(
        context,
        quizId,
        quiz.deliveryId,
      ),
    ]);
  // Legacy report parity: retakes contribute only the learner's latest
  // attempt to standing, distribution and question accuracy.
  // Roster failure must not hide the already-authorized attempt summary.
  // Never infer non-attempting learners without a current roster.
  const rosterScope=rosterRead.ok?rosterRead.value:null;
  // An unavailable roster must never be treated as authorization to disclose
  // historical or otherwise ineligible learner attempts.
  const scopedAttempts=rosterScope
    ?facultyReportCurrentRosterRows(attempts,rosterScope.roster):[];
  const latestAttempts =
    latestQuizAttemptsByLearner(scopedAttempts);
  const learners = new Set(
    latestAttempts.map(
      (attempt) => attempt.membershipId,
    ),
  );
  const notAttemptedLearners =
    (rosterScope?.roster??[]).filter(
      (learner) =>
        !learners.has(learner.membershipId),
    );
  const scored = latestAttempts.flatMap(
    (attempt) =>
      Number.isFinite(attempt.maxScore) &&
      Number.isFinite(attempt.score) &&
      attempt.maxScore > 0 &&
      attempt.score >= 0 &&
      attempt.score <= attempt.maxScore
        ? [
            Math.round(
              (attempt.score /
                attempt.maxScore) *
                100,
            ),
          ]
        : [],
  );
  const latestScoreSummary =
    scoreSummary(latestAttempts);
  return {
    quiz,
    rosterUnavailable:rosterScope===null,
    attempts:scopedAttempts,
    latestAttempts,
    distribution:
      buildScoreDistribution(scored),
    questions: questionAccuracy(
      authoredQuiz.questions,
      latestAttempts,
    ),
    notAttemptedLearners,
    metrics: {
      ...latestScoreSummary,
      totalAttempts: scopedAttempts.length,
      eligibleLearners:
        rosterScope?.roster.length??latestAttempts.length,
      eligibleLearnersKnown:rosterScope!==null,
      uniqueLearners: learners.size,
      submittedLearners:
        latestAttempts.length,
      notAttempted:
        notAttemptedLearners.length,
      questionCount:
        authoredQuiz.questions.length,
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
  const [submissions, rosterRead] =
    await Promise.all([
      listAssignmentSubmissions(context,assignmentId,assignment.deliveryId),
      getFacultyDeliveryRoster(context,assignment.deliveryId)
        .then(value=>({ok:true as const,value}))
        .catch(()=>({ok:false as const})),
    ]);
  const rosterScope=rosterRead.ok?rosterRead.value:null;
  // A historical submission is not permission to view that learner after
  // their enrollment ended; never drop the current-roster filter on failure.
  const scopedSubmissions=rosterScope
    ?facultyReportCurrentRosterRows(submissions,rosterScope.roster):[];
  const submittedMemberships = new Set(
    scopedSubmissions.map(
      (submission) => submission.membershipId,
    ),
  );
  const missingLearners =
    (rosterScope?.roster??[]).filter(
      (learner) =>
        !submittedMemberships.has(
          learner.membershipId,
        ),
    );
  const graded = scopedSubmissions.filter((submission) =>
    submission.gradingStatus === "GRADED",
  );
  const late = scopedSubmissions.filter((submission) =>
    assignment.dueAt !== null &&
    submission.submittedAt.getTime() > assignment.dueAt.getTime(),
  );
  const scores = assignmentScoreSummary(
    scopedSubmissions,
    assignment.maxPoints,
  );
  return {
    assignment,
    rosterUnavailable:rosterScope===null,
    submissions:scopedSubmissions,
    missingLearners,
    distribution: scores.distribution,
    metrics: {
      eligibleLearners:
        rosterScope?.roster.length??0,
      submitted: scopedSubmissions.length,
      missing: missingLearners.length,
      onTime:
        scopedSubmissions.length - late.length,
      late: late.length,
      graded: graded.length,
      gradePublished: scopedSubmissions.filter(
        (item) => item.gradePublished,
      ).length,
      averagePercent:
        scores.averagePercent,
    },
  };
}
