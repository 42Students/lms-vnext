/**
 * The legacy learner quiz table distinguishes an expired missed quiz from a
 * submitted quiz whose retake window has closed. Both are read-only review,
 * never a new attempt. No scores/answer keys are implied by a review link:
 * those remain guarded in the server's results-publish policy.
 */
export type QuizOverviewStatus = {
  status: "PUBLISHED" | "CLOSED";
  dueAt: string | null;
  attemptsUsed: number;
  attemptsRemaining: number;
  resultsPublished: boolean;
  progressStatus: "NOT_STARTED" | "COMPLETED" | "MISSED";
};

export function quizOverviewActionState(
  item: QuizOverviewStatus,
  now: number = Date.now(),
) {
  const dueMillis = item.dueAt
    ? Date.parse(item.dueAt)
    : Number.POSITIVE_INFINITY;
  const expired = Number.isFinite(dueMillis) && dueMillis < now;
  const closed = item.status !== "PUBLISHED";
  const exhausted = item.attemptsRemaining <= 0;

  if (closed && item.resultsPublished && item.attemptsUsed > 0) {
    return {
      label: "Results published",
      tone: "success" as const,
      action: "View Result",
      review: true,
    };
  }
  if (item.attemptsUsed > 0 && (closed || expired || exhausted)) {
    return {
      label: "Submitted",
      tone: "info" as const,
      action: "Review attempt",
      review: true,
    };
  }
  if (expired || item.progressStatus === "MISSED") {
    return {
      label: "Missed",
      tone: "error" as const,
      action: "View answers",
      review: true,
    };
  }
  if (closed) {
    return {
      label: "Closed",
      tone: "neutral" as const,
      action: "Review quiz",
      review: true,
    };
  }
  if (item.attemptsUsed > 0) {
    return {
      label: "Submitted",
      tone: "info" as const,
      action: "Retake Quiz",
      review: false,
    };
  }
  return {
    label: "Not attempted",
    tone: "neutral" as const,
    action: "Start Quiz",
    review: false,
  };
}
