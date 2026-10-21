import dayjs from "dayjs";
import { buildScoreDistribution } from "./scoreDistribution";

function studentName(attempt) {
  return attempt?.learnerName || (attempt?.learnerId ? `Student ${attempt.learnerId}` : "Unknown student");
}

/**
 * Builds a per-quiz report from data the "View Submissions" flow already fetches --
 * getQuizV2(quizId, { includeCorrectAnswers: true }) for question metadata, and
 * getQuizSubmissionsV2(quizId) for every attempt (each with a per-question answers[] already
 * including correctness -- see QuizServiceImpl#toAttemptResponse on the backend). No new
 * endpoints, no backend changes.
 *
 * `roster`, if passed (getLearnersByClass(quiz.classId)), gives a real completion rate; a SHARED
 * quiz (classId 0/null) has no single roster to complete against, so it's optional and completion
 * then just reflects submissions with no denominator.
 */
export function buildQuizReport({ quiz, submissions, roster } = {}) {
  const questions = [...(quiz?.questions ?? [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // A learner can have multiple attempts (maxAttempts > 1); the report reflects each student's
  // most recent attempt -- their final standing, same convention the quiz list's own
  // "latestScore" column already uses. Compared by submittedAt, not attemptNumber: the backend
  // already returns attempts ordered by submittedAt DESC, but comparing ordinal attempt numbers
  // with >= inverts the pick on an exact tie (a duplicate/anomalous attemptNumber would let a
  // chronologically EARLIER attempt later in the DESC-ordered array overwrite the correct one).
  // Timestamp comparison matches the same dedup convention already used in assignmentReport.js
  // and useFacultyCourseStats.js.
  const latestByLearner = new Map();
  for (const attempt of submissions ?? []) {
    const id = attempt?.learnerId;
    if (id == null) continue;
    const existing = latestByLearner.get(id);
    if (!existing) {
      latestByLearner.set(id, attempt);
      continue;
    }
    const attemptTime = attempt.submittedAt ? new Date(attempt.submittedAt).getTime() : -Infinity;
    const existingTime = existing.submittedAt ? new Date(existing.submittedAt).getTime() : -Infinity;
    if (attemptTime > existingTime
      || (attemptTime === existingTime && (attempt.attemptNumber ?? 0) > (existing.attemptNumber ?? 0))) {
      latestByLearner.set(id, attempt);
    }
  }
  const latestAttempts = Array.from(latestByLearner.values());

  const students = latestAttempts
    .map((attempt) => {
      // attempt.score/maxScore null (e.g. an unrevealed/in-progress attempt) must produce a null
      // percent, not NaN -- `attempt.maxScore ? ... : null` alone only guarded the denominator;
      // score / maxScore is NaN when score is null and maxScore is truthy, and NaN is neither
      // caught by the `percent != null` filter below nor sorts sanely.
      const percent = (attempt.score != null && attempt.maxScore)
        ? Math.round((attempt.score / attempt.maxScore) * 100)
        : null;
      return {
        id: attempt.learnerId,
        name: studentName(attempt),
        score: attempt.score ?? null,
        maxScore: attempt.maxScore ?? totalPoints,
        percent,
        submittedAt: attempt.submittedAt,
      };
    })
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

  const scored = students.filter((s) => s.percent != null);
  const avgPercent = scored.length > 0
    ? Math.round(scored.reduce((sum, s) => sum + s.percent, 0) / scored.length)
    : null;

  // Worst-first: the question most worth a faculty member's attention is the one the class
  // collectively missed most, not the one nobody has answered yet -- unanswered questions
  // (accuracyPercent null) sort to the end, not the top, since "no data" isn't "everyone got it
  // wrong".
  const questionStats = questions
    .map((q) => {
      let correctCount = 0;
      let answeredCount = 0;
      for (const attempt of latestAttempts) {
        const answer = (attempt.answers ?? []).find((a) => a.questionId === q.id);
        if (!answer) continue;
        answeredCount++;
        if (answer.correct) correctCount++;
      }
      return {
        id: q.id,
        prompt: q.prompt,
        points: q.points,
        answeredCount,
        correctCount,
        accuracyPercent: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : null,
      };
    })
    .sort((a, b) => (a.accuracyPercent ?? 101) - (b.accuracyPercent ?? 101));

  const rosterSize = Array.isArray(roster) ? roster.length : null;

  return {
    title: quiz?.title || "Untitled quiz",
    dueDate: quiz?.dueAt || null,
    totalPoints,
    questionCount: questions.length,
    rosterSize,
    submittedCount: students.length,
    completionPercent: rosterSize ? Math.round((students.length / rosterSize) * 100) : null,
    avgPercent,
    distribution: buildScoreDistribution(scored.map((s) => s.percent)),
    questions: questionStats,
    students,
    generatedAt: dayjs().format("MMM D, YYYY [at] h:mm A"),
  };
}
