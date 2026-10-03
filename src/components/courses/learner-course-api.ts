export type CourseApiErrorBody = {
  error?: string;
  issues?: Array<{
    message?: string;
  }>;
};

const errorLabels: Record<string, string> = {
  INVALID_REQUEST:
    "Please check the information and try again.",
  INVALID_ORIGIN:
    "This action could not be verified. Refresh the page and try again.",
  ASSIGNMENT_ALREADY_SUBMITTED:
    "This assignment has already been submitted.",
  ASSIGNMENT_DEADLINE_PASSED:
    "The assignment deadline has passed.",
  ASSIGNMENT_NOT_PUBLISHED:
    "This assignment is not currently available.",
  QUIZ_DEADLINE_PASSED:
    "The quiz deadline has passed.",
  QUIZ_MAX_ATTEMPTS_REACHED:
    "No quiz attempts remain.",
  QUIZ_ATTEMPT_CONFLICT:
    "Another quiz attempt was recorded at the same time. Refresh and try again.",
  QUIZ_NOT_PUBLISHED:
    "This quiz is not currently accepting attempts.",
  QUIZ_ANSWER_INVALID:
    "One or more quiz answers are invalid. Refresh the quiz and try again.",
  LEARNER_ENROLLMENT_SCOPE_REQUIRED:
    "This Course delivery is not assigned to your active Section.",
  LEARNING_ACCESS_DENIED:
    "You do not have access to this Course item.",
  CONTENT_DELIVERY_MISMATCH:
    "This content does not belong to your Course delivery.",
};

export async function courseApiError(
  response: Response,
) {
  let body: CourseApiErrorBody | null = null;

  try {
    body =
      (await response.json()) as CourseApiErrorBody;
  } catch {
    return "Something went wrong. Please try again.";
  }

  const issue = body.issues?.find(
    (candidate) =>
      typeof candidate.message === "string" &&
      candidate.message.length > 0,
  )?.message;

  if (issue) return issue;

  if (body.error && errorLabels[body.error]) {
    return errorLabels[body.error];
  }

  return "Something went wrong. Please try again.";
}
