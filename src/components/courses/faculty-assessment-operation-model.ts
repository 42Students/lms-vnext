export function assignmentSubmissionActions(input: {
  gradingStatus: "NOT_GRADED" | "GRADED";
  gradePublished: boolean;
}) {
  return {
    canGrade: true,
    canPublish:
      input.gradingStatus === "GRADED" &&
      !input.gradePublished,
    isPublished: input.gradePublished,
  };
}

export function quizReviewActions(input: {
  deliveryOwned: boolean;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "CLOSED"
    | "ARCHIVED";
  resultsPublished: boolean;
}) {
  return {
    canReviewAttempts:
      input.status === "PUBLISHED" ||
      input.status === "CLOSED",
    canPublishResults:
      input.deliveryOwned &&
      input.status === "CLOSED" &&
      !input.resultsPublished,
    canHideResults:
      input.deliveryOwned &&
      input.status === "CLOSED" &&
      input.resultsPublished,
  };
}
