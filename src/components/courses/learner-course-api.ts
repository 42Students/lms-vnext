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
  ASSIGNMENT_SUBMISSION_CONFLICT:
    "This grade changed after you opened it. Refresh the submissions and try again.",
  ASSIGNMENT_GRADE_INVALID:
    "The grade is outside the allowed point range.",
  ASSIGNMENT_NOT_GRADED:
    "Save a grade before publishing it.",
  CONTENT_TYPE_SHAPE_INVALID:
    "The content details do not match the selected content type.",
  LESSON_CONTENT_NOT_PUBLISHED:
    "This content is not published.",
  INVALID_LESSON_CONTENT_TRANSITION:
    "This content cannot move to that lifecycle state.",
  ASSIGNMENT_NAME_CONFLICT:
    "An active assignment with this title already exists in the same audience.",
  ASSIGNMENT_SEQUENCE_CONFLICT:
    "Another active assignment already uses this order.",
  INVALID_ASSIGNMENT_TRANSITION:
    "This assignment cannot move to that lifecycle state.",
  QUIZ_NAME_CONFLICT:
    "An active quiz with this title already exists in the same audience.",
  QUIZ_SEQUENCE_CONFLICT:
    "Another active quiz already uses this order.",
  INVALID_QUIZ_TRANSITION:
    "This quiz cannot move to that lifecycle state.",
  QUIZ_HAS_ATTEMPTS:
    "This quiz can no longer be structurally changed because attempts already exist.",
  FACULTY_TEACHING_SCOPE_REQUIRED:
    "You need an active teaching assignment for this exact Section delivery.",
  COURSE_NAME_CONFLICT:
    "An active Course with this name already exists in the Department.",
  COURSE_CODE_CONFLICT:
    "An active Course with this code already exists in the Department.",
  COURSE_HAS_ACTIVE_OFFERINGS:
    "Archive active Course Offerings before archiving this Course.",
  OFFERING_CONFLICT:
    "This Course is already offered to the selected Cohort and Academic Period.",
  OFFERING_NOT_MUTABLE:
    "This Course Offering is no longer mutable.",
  OFFERING_COHORT_PERIOD_MISMATCH:
    "The Academic Period is outside the selected Cohort's valid period window.",
  ACADEMIC_PERIOD_CLOSED:
    "The selected Academic Period is closed.",
  COHORT_NOT_MUTABLE:
    "The selected Cohort is no longer available for new Course operations.",
  OFFERING_HAS_ACTIVE_DELIVERIES:
    "End active Section Deliveries before archiving this Offering.",
  SECTION_DELIVERY_CONFLICT:
    "This Offering is already connected to the selected Section.",
  SECTION_NOT_DELIVERABLE:
    "The selected Section does not match this Offering's Cohort and Academic Period.",
  DELIVERY_HAS_ACTIVE_TEACHERS:
    "End active Teaching Assignments before ending this Section Delivery.",
  TEACHING_ASSIGNMENT_CONFLICT:
    "This Faculty member already has an active Teaching Assignment for the delivery.",
  PRIMARY_TEACHER_CONFLICT:
    "This Section Delivery already has an active Primary teacher.",
  FACULTY_ROLE_REQUIRED:
    "The selected membership does not have the Faculty role.",
  MEMBERSHIP_NOT_ACTIVE:
    "The selected Faculty membership is not active.",
  MEMBERSHIP_COLLEGE_MISMATCH:
    "The selected Faculty membership belongs to a different college.",
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
