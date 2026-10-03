export type CoursesServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "COURSE_NOT_FOUND"
  | "COURSE_NAME_CONFLICT"
  | "COURSE_CODE_CONFLICT"
  | "COURSE_HAS_ACTIVE_OFFERINGS"
  | "COURSE_COLLEGE_MISMATCH"
  | "OFFERING_NOT_FOUND"
  | "OFFERING_CONFLICT"
  | "OFFERING_NOT_MUTABLE"
  | "OFFERING_HAS_ACTIVE_DELIVERIES"
  | "OFFERING_COHORT_PERIOD_MISMATCH"
  | "ACADEMIC_PERIOD_CLOSED"
  | "COHORT_NOT_MUTABLE"
  | "SECTION_DELIVERY_NOT_FOUND"
  | "SECTION_DELIVERY_CONFLICT"
  | "SECTION_DELIVERY_NOT_ACTIVE"
  | "SECTION_NOT_DELIVERABLE"
  | "DELIVERY_HAS_ACTIVE_TEACHERS"
  | "TEACHING_ASSIGNMENT_NOT_FOUND"
  | "TEACHING_ASSIGNMENT_CONFLICT"
  | "PRIMARY_TEACHER_CONFLICT"
  | "MEMBERSHIP_NOT_FOUND"
  | "MEMBERSHIP_NOT_ACTIVE"
  | "MEMBERSHIP_COLLEGE_MISMATCH"
  | "FACULTY_ROLE_REQUIRED";

export class CoursesServiceError extends Error {
  constructor(
    public readonly code: CoursesServiceErrorCode,
  ) {
    super(code);
    this.name = "CoursesServiceError";
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
