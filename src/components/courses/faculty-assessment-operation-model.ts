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
  deadlineReached?: boolean;
}) {
  const mayRelease=input.status==="CLOSED" ||
    (input.status==="PUBLISHED"&&Boolean(input.deadlineReached));
  return {
    canReviewAttempts:
      input.status === "PUBLISHED" ||
      input.status === "CLOSED",
    canPublishResults:
      input.deliveryOwned &&
      mayRelease &&
      !input.resultsPublished,
    canHideResults:
      input.deliveryOwned &&
      mayRelease &&
      input.resultsPublished,
  };
}
