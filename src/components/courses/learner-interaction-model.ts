export type ProgressStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MISSED";

export function assignmentInteractionState(input: {
  submissionId: string | null;
  progressStatus: ProgressStatus;
}) {
  return {
    canSubmit:
      !input.submissionId &&
      input.progressStatus !== "MISSED",
    submitted: Boolean(input.submissionId),
    missed: input.progressStatus === "MISSED",
  };
}

export function quizInteractionState(input: {
  status: "PUBLISHED" | "CLOSED";
  attemptsUsed: number;
  attemptsRemaining: number;
  resultsPublished: boolean;
  progressStatus: ProgressStatus;
}) {
  const canAttempt =
    input.status === "PUBLISHED" &&
    input.attemptsRemaining > 0 &&
    input.progressStatus !== "MISSED";

  return {
    canAttempt,
    canReviewResults:
      input.status === "CLOSED" &&
      input.resultsPublished &&
      input.attemptsUsed > 0,
    waitingForResults:
      input.status === "CLOSED" &&
      input.attemptsUsed > 0 &&
      !input.resultsPublished,
    exhausted:
      input.status === "PUBLISHED" &&
      input.attemptsUsed > 0 &&
      input.attemptsRemaining === 0,
    missed:
      input.progressStatus === "MISSED",
  };
}

export function resourceInteractionState(input: {
  type: string;
  externalUrl: string | null;
  storageKey?: string | null;
  progressStatus: ProgressStatus;
}) {
  return {
    canMarkComplete:
      input.type === "RESOURCE" &&
      Boolean(
        input.externalUrl ||
          input.storageKey,
      ) &&
      input.progressStatus !== "COMPLETED",
  };
}

export function isAssignmentOverdue(
  submissionId: string | null | undefined,
  dueAt: Date | null | undefined,
  nowMs: number = Date.now(),
) {
  return !submissionId && Boolean(dueAt) && dueAt!.getTime() < nowMs;
}
