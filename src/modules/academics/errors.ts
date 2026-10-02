export type AcademicsServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "PROGRAM_NOT_FOUND"
  | "ACADEMIC_PERIOD_NOT_FOUND"
  | "COHORT_NOT_FOUND"
  | "SECTION_NOT_FOUND"
  | "PROGRAM_NAME_CONFLICT"
  | "PROGRAM_CODE_CONFLICT"
  | "ACADEMIC_PERIOD_CODE_CONFLICT"
  | "COHORT_CODE_CONFLICT"
  | "SECTION_NAME_CONFLICT"
  | "SECTION_CODE_CONFLICT"
  | "ACADEMIC_PERIOD_COLLEGE_MISMATCH"
  | "COHORT_PERIOD_RANGE_INVALID"
  | "SECTION_PERIOD_OUTSIDE_COHORT"
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
  if (
    error &&
    typeof error === "object" &&
    "constraint" in error &&
    typeof (error as { constraint?: unknown })
      .constraint === "string"
  ) {
    return (error as { constraint: string })
      .constraint;
  }

  return null;
}
