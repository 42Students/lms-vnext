/**
 * One home for "which HTTP status does this error code get". Services throw their own coded errors; this table is the only
 * place a code is tied to a status, so changing a status (or the wording behind it) is a one-line edit that every route picks up.
 *
 * Resolution order for a code in a family: explicit override, then the not-found / forbidden / bad-request / unprocessable
 * lists, then the family's fallback. tests/unit/sec-error-status-golden.test.ts pins the result for every known code.
 */
export type ErrorFamilyName =
  | "department"
  | "organization"
  | "college"
  | "academics"
  | "courses"
  | "projects"
  | "placements"
  | "activity"
  | "adminScope"
  | "tenantDomain"
  | "people"
  | "tpoCompanyMemory"
  | "tpoCrm"
  | "tpoMessaging"
  | "lectureHall";

export type ErrorFamily = {
  fallback: number;
  overrides?: Readonly<Record<string, number>>;
  notFound?: readonly string[];
  forbidden?: readonly string[];
  badRequest?: readonly string[];
  unprocessable?: readonly string[];
};

export const ERROR_FAMILIES: Readonly<Record<ErrorFamilyName, ErrorFamily>> = {
  department: { fallback: 404, overrides: { DEPARTMENT_NAME_CONFLICT: 409 } },
  organization: { fallback: 404, overrides: { ORGANIZATION_NAME_CONFLICT: 409, ORGANIZATION_HAS_COLLEGES: 409 } },
  college: { fallback: 404, overrides: { COLLEGE_CODE_CONFLICT: 409 } },
  adminScope: { fallback: 404 },
  tenantDomain: { fallback: 409, notFound: ["DOMAIN_NOT_FOUND", "COLLEGE_NOT_FOUND"] },
  people: {
    fallback: 409,
    notFound: ["COLLEGE_NOT_FOUND", "MEMBERSHIP_NOT_FOUND", "DEPARTMENT_NOT_FOUND"],
    badRequest: ["ALTERNATE_PHONE_INVALID", "ALTERNATE_PHONE_SAME_AS_PRIMARY"],
  },
  activity: {
    fallback: 409,
    notFound: ["ACTIVITY_SCOPE_NOT_FOUND", "ACTIVITY_EVENT_NOT_FOUND", "NOTIFICATION_NOT_FOUND", "NOTIFICATION_RECIPIENT_NOT_FOUND"],
  },
  academics: {
    fallback: 409,
    notFound: [
      "COLLEGE_NOT_FOUND",
      "DEPARTMENT_NOT_FOUND",
      "PROGRAM_NOT_FOUND",
      "ACADEMIC_PERIOD_NOT_FOUND",
      "COHORT_NOT_FOUND",
      "SECTION_NOT_FOUND",
      "LEARNER_ENROLLMENT_NOT_FOUND",
      "SECTION_ENROLLMENT_NOT_FOUND",
      "FACULTY_ASSIGNMENT_NOT_FOUND",
      "SCHEDULE_EVENT_NOT_FOUND",
      "MEMBERSHIP_NOT_FOUND",
    ],
    // AcademicsServiceError is not a permission decision by itself; only explicit access-denied codes are 403.
    forbidden: [
      "ACADEMICS_ACCESS_DENIED",
      "FACULTY_ACCESS_DENIED",
      "LEARNER_SCHEDULE_ACCESS_DENIED",
      "LEARNER_ROLE_REQUIRED",
      "FACULTY_ROLE_REQUIRED",
      "MEMBERSHIP_NOT_ACTIVE",
      "MEMBERSHIP_COLLEGE_MISMATCH",
    ],
  },
  courses: {
    fallback: 409,
    notFound: [
      "COLLEGE_NOT_FOUND",
      "DEPARTMENT_NOT_FOUND",
      "COURSE_NOT_FOUND",
      "OFFERING_NOT_FOUND",
      "SECTION_DELIVERY_NOT_FOUND",
      "TEACHING_ASSIGNMENT_NOT_FOUND",
      "LEARNING_PATH_NOT_FOUND",
      "LESSON_NOT_FOUND",
      "LESSON_CONTENT_NOT_FOUND",
      "MEMBERSHIP_NOT_FOUND",
      "ASSIGNMENT_NOT_FOUND",
      "ASSIGNMENT_SUBMISSION_NOT_FOUND",
      "QUIZ_NOT_FOUND",
      "QUIZ_ATTEMPT_NOT_FOUND",
      "DISCUSSION_MESSAGE_NOT_FOUND",
      "COORDINATOR_NOT_FOUND",
    ],
    forbidden: [
      "LEARNING_ACCESS_DENIED",
      "FACULTY_TEACHING_SCOPE_REQUIRED",
      "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
      "LEARNER_PROGRESS_ACCESS_DENIED",
      "DISCUSSION_POST_ACCESS_DENIED",
      "DISCUSSION_MODERATION_ACCESS_DENIED",
    ],
    badRequest: [
      "CONTENT_TYPE_SHAPE_INVALID",
      "CONTENT_NOT_STARTED",
      "TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED",
      "CONTENT_DURATION_REQUIRED",
      "LIVE_CLASS_NOT_FINISHED",
      "COURSE_VISIBILITY_BULK_TOO_LARGE",
      "ASSIGNMENT_GRADE_INVALID",
      "ASSIGNMENT_DEADLINE_PASSED",
      "ASSIGNMENT_DEADLINE_NOT_CONFIGURED",
      "ASSIGNMENT_METHOD_NOT_ALLOWED",
      "QUIZ_QUESTION_INVALID",
      "QUIZ_DEADLINE_NOT_CONFIGURED",
      "QUIZ_OPTION_INVALID",
      "QUIZ_ANSWER_INVALID",
      "COORDINATOR_NOT_ELIGIBLE",
    ],
  },
  projects: {
    fallback: 409,
    overrides: { PROJECT_UPDATE_RATE_LIMITED: 429 },
    notFound: [
      "COLLEGE_NOT_FOUND",
      "PROJECT_TEMPLATE_NOT_FOUND",
      "PROJECT_TEMPLATE_VERSION_NOT_FOUND",
      "PROJECT_TEMPLATE_ASSIGNMENT_NOT_FOUND",
      "PROJECT_NOT_FOUND",
      "PROJECT_MEMBER_NOT_FOUND",
      "PROJECT_RELEASE_NOT_FOUND",
      "PROJECT_SPRINT_NOT_FOUND",
      "PROJECT_TASK_NOT_FOUND",
      "PROJECT_TASK_SUBMISSION_NOT_FOUND",
      "PROJECT_SUBMISSION_NOT_FOUND",
      "PROJECT_RESOURCE_NOT_FOUND",
      "PROJECT_MEETING_NOT_FOUND",
    ],
    forbidden: [
      "PROJECT_ACCESS_DENIED",
      "PROJECT_LIFECYCLE_ACCESS_DENIED",
      "PROJECT_TASK_SUBMISSION_ACCESS_DENIED",
      "PROJECT_SUBMISSION_ACCESS_DENIED",
      "PROJECT_MEETING_ACCESS_DENIED",
    ],
  },
  placements: {
    fallback: 409,
    overrides: { PLACEMENT_APPLICATION_RATE_LIMITED: 429 },
    notFound: [
      "COLLEGE_NOT_FOUND",
      "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND",
      "PLACEMENT_RECRUITER_USER_NOT_FOUND",
      "PLACEMENT_RECRUITER_GRANT_NOT_FOUND",
      "PLACEMENT_OWNER_MEMBERSHIP_NOT_FOUND",
      "PLACEMENT_SEASON_NOT_FOUND",
      "PLACEMENT_JOB_NOT_FOUND",
      "PLACEMENT_ROLE_OPTION_NOT_FOUND",
      "PLACEMENT_LEARNER_MEMBERSHIP_NOT_FOUND",
      "PLACEMENT_ELIGIBILITY_OVERRIDE_NOT_FOUND",
      "PLACEMENT_APPLICATION_NOT_FOUND",
      "PLACEMENT_SCREENING_NOT_FOUND",
      "PLACEMENT_ROUND_NOT_FOUND",
      "PLACEMENT_RESULT_NOT_FOUND",
      "PLACEMENT_OFFER_NOT_FOUND",
      "PLACEMENT_REQUEST_NOT_FOUND",
      "PLACEMENT_COORDINATOR_ASSIGNMENT_NOT_FOUND",
      "PLACEMENT_DRIVE_DAY_CANDIDATE_NOT_FOUND",
    ],
    forbidden: ["PLACEMENT_DRIVE_DAY_ACCESS_DENIED", "PLACEMENT_DRIVE_DAY_ATTENDANCE_FORBIDDEN"],
  },
  // TPO families that answered on their own before the registry existed.
  tpoCompanyMemory: { fallback: 422, notFound: ["TPO_COMPANY_NOT_FOUND"] },
  tpoCrm: {
    fallback: 409,
    notFound: ["TPO_CRM_LEAD_NOT_FOUND", "TPO_CRM_FOLLOWUP_NOT_FOUND"],
    unprocessable: ["TPO_CRM_CONTACT_REQUIRED", "TPO_CRM_INVALID_DUE_AT"],
  },
  lectureHall: { fallback: 409, notFound: ["COLLEGE_NOT_FOUND", "HALL_NOT_FOUND"], badRequest: ["DEPARTMENT_NOT_FOUND"] },
  tpoMessaging: {
    fallback: 403,
    notFound: ["TPO_MESSAGE_THREAD_NOT_FOUND", "TPO_MESSAGE_RECRUITER_NOT_FOUND", "TPO_MESSAGE_JOB_NOT_FOUND"],
  },
};

export function statusForCode(family: ErrorFamilyName, code: string): number {
  const f = ERROR_FAMILIES[family];
  const override = f.overrides?.[code];
  if (override !== undefined) return override;
  if (f.notFound?.includes(code)) return 404;
  if (f.forbidden?.includes(code)) return 403;
  if (f.badRequest?.includes(code)) return 400;
  if (f.unprocessable?.includes(code)) return 422;
  return f.fallback;
}

/** Every code any family names, for tests that sweep the whole table. */
export const ERROR_CODE_UNIVERSE: readonly string[] = [
  ...new Set(
    Object.values(ERROR_FAMILIES).flatMap((f) => [
      ...Object.keys(f.overrides ?? {}),
      ...(f.notFound ?? []),
      ...(f.forbidden ?? []),
      ...(f.badRequest ?? []),
      ...(f.unprocessable ?? []),
    ]),
  ),
].sort();

/**
 * An error a service can throw without inventing a class: the code picks the status through the shared table, or the status
 * is given outright. `safeMessage` is what a person may be told; `retryable` tells clients whether the same request can succeed later.
 */
export class AppError extends Error {
  readonly status: number;
  readonly safeMessage: string | undefined;
  readonly retryable: boolean;
  readonly details: Readonly<Record<string, unknown>> | undefined;
  constructor(
    readonly code: string,
    options: { status: number; safeMessage?: string; retryable?: boolean; details?: Record<string, unknown> },
  ) {
    super(code);
    this.name = "AppError";
    this.status = options.status;
    this.safeMessage = options.safeMessage;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}
