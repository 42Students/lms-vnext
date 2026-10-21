export type AcademicsServiceErrorCode =
  | "INVALID_LEARNER_SCHEDULE_WINDOW"
  | "COLLEGE_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "PROGRAM_NOT_FOUND"
  | "ACADEMIC_PERIOD_NOT_FOUND"
  | "COHORT_NOT_FOUND"
  | "SECTION_NOT_FOUND"
  | "PROGRAM_NAME_CONFLICT"
  | "PROGRAM_CODE_CONFLICT"
  | "PROGRAM_DEPARTMENT_COLLEGE_MISMATCH"
  | "ACADEMIC_PERIOD_CODE_CONFLICT"
  | "COHORT_CODE_CONFLICT"
  | "SECTION_NAME_CONFLICT"
  | "SECTION_CODE_CONFLICT"
  | "SECTION_HAS_STUDENTS"
  | "SECTION_HAS_SCHEDULE"
  | "ACADEMIC_PERIOD_COLLEGE_MISMATCH"
  | "COHORT_PERIOD_RANGE_INVALID"
  | "SECTION_PERIOD_OUTSIDE_COHORT"
  | "MEMBERSHIP_NOT_FOUND"
  | "MEMBERSHIP_NOT_ACTIVE"
  | "LEARNER_ROLE_REQUIRED"
  | "FACULTY_ROLE_REQUIRED"
  | "LEARNER_ENROLLMENT_NOT_FOUND"
  | "LEARNER_ALREADY_ENROLLED"
  | "LEARNER_ENROLLMENT_NOT_ACTIVE"
  | "COHORT_PROGRAM_MISMATCH"
  | "ENROLLMENT_COLLEGE_MISMATCH"
  | "MEMBERSHIP_COLLEGE_MISMATCH"
  | "SECTION_ENROLLMENT_NOT_FOUND"
  | "SECTION_ENROLLMENT_CONFLICT"
  | "CLASS_UNAVAILABLE"
  | "CLASS_BATCH_MISMATCH"
  | "ALREADY_PLACED_IN_PERIOD"
  | "CLASS_FULL"
  | "SECTION_COHORT_MISMATCH"
  | "SECTION_CAPACITY_REACHED"
  | "SECTION_PERIOD_REGRESSION"
  | "FACULTY_ASSIGNMENT_NOT_FOUND"
  | "FACULTY_ASSIGNMENT_CONFLICT"
  | "SCHEDULE_EVENT_NOT_FOUND"
  | "SCHEDULE_EVENT_TIME_INVALID"
  | "SCHEDULE_EVENT_OUTSIDE_PERIOD"
  | "SCHEDULE_SECTION_CONFLICT"
  | "SCHEDULE_FACULTY_CONFLICT"
  | "SCHEDULE_HALL_CONFLICT"
  | "SCHEDULE_HALL_NOT_FOUND"
  | "SCHEDULE_HALL_CAPACITY_CONFLICT"
  | "SCHEDULE_COURSE_DELIVERY_MISMATCH"
  | "LEARNER_SCHEDULE_ACCESS_DENIED"
  | "INVALID_ACADEMIC_PERIOD_TRANSITION"
  | "INVALID_COHORT_TRANSITION"
  | "PROGRAM_HAS_COHORTS"
  | "COHORT_NOT_MUTABLE"
  | "ACADEMIC_PERIOD_CLOSED";

export class AcademicsServiceError extends Error {
  constructor(
    public readonly code: AcademicsServiceErrorCode,
  ) {
    super(code);
    this.name = "AcademicsServiceError";
  }
}

export function postgresConstraintName(
  error: unknown,
) {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object") {
      return null;
    }

    if (
      "constraint" in current &&
      typeof (current as { constraint?: unknown })
        .constraint === "string"
    ) {
      return (current as { constraint: string })
        .constraint;
    }

    if ("cause" in current) {
      current = (current as { cause?: unknown }).cause;
      continue;
    }

    return null;
  }

  return null;
}
