import { NextResponse } from "next/server";
import { friendlyApiError } from "@/lib/friendly-error";
import { createRequestId } from "@/lib/request-id";
import { isDatabaseUnavailableError } from "@/lib/db-outage";
import { ZodError } from "zod";
import { SessionAuthenticationError } from "@/auth/session";
import { ContextResolutionError } from "@/modules/identity/context-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { DepartmentHasDependenciesError } from "@/modules/departments/archive-policy";
import { DepartmentServiceError } from "@/modules/departments/service";
import { OrganizationServiceError } from "@/modules/organizations/service";
import { CollegeHasDependenciesError } from "@/modules/colleges/archive-policy";
import { CollegeServiceError } from "@/modules/colleges/service";
import { PeopleServiceError } from "@/modules/people/errors";
import { TenantDomainServiceError } from "@/modules/tenant-domains/service";
import { AdminScopeServiceError } from "@/modules/admin-scope/service";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { CoursesServiceError } from "@/modules/courses/errors";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { ActivityServiceError } from "@/modules/activity/errors";
import { StorageFileError } from "@/modules/storage/file-errors";
import { logError } from "@/observability/logger";
import {StudentRuleConflict} from "@/modules/module-access/admin-student-rule-write";

/**
 * GR-06 / GR-07: retain machine error keys for existing callers, but always
 * supply customer-safe message, a reference and the x-request-id header.
 * Usage: catch (error) { return apiErrorResponse(error); }
 */
export function apiErrorResponse(error: unknown) {
  const requestId = createRequestId();
  const respond = (body: Record<string, unknown>, init?: ResponseInit) => {
    const status = init?.status ?? 500;
    const headers = new Headers(init?.headers);
    headers.set("x-request-id", requestId);
    if (status === 429 || status === 503) headers.set("Retry-After", "60");
    const code = typeof body.error === "string" ? body.error : undefined;
    return NextResponse.json({
      ...body,
      // Teaching-scope denial is safe to explain without exposing a foreign
      // course. Other authorization failures intentionally remain generic.
      message: code === "FACULTY_TEACHING_SCOPE_REQUIRED"
        ? "You do not teach this course or class"
        : friendlyApiError({ status, code }),
      requestId,
    }, { ...init, status, headers });
  };
  if (error instanceof ZodError) {
    return respond(
      {
        error: "INVALID_REQUEST",
        fieldErrors: Object.fromEntries(error.issues
          .filter((issue) => issue.path.length > 0)
          .map((issue) => [issue.path.join("."), "Please check this field."])),
        issues: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof StorageFileError) {
    return respond({ error: error.code }, { status: error.status });
  }

  if (error instanceof SessionAuthenticationError) {
    return respond(
      { error: error.code },
      { status: 401 },
    );
  }

  if (error instanceof ContextResolutionError) {
    return respond(
      { error: error.code },
      {
        status:
          error.code === "MEMBERSHIP_NOT_FOUND" ||
          error.code === "MEMBERSHIP_NOT_ACTIVE"
            ? 403
            : 401,
      },
    );
  }

  if (error instanceof StudentRuleConflict) return respond({error:error.code},{status:409});

  if (error instanceof AuthorizationError) {
    return respond(
      { error: "FORBIDDEN" },
      { status: 403 },
    );
  }

  if (
    error instanceof
    DepartmentHasDependenciesError
  ) {
    return respond(
      {
        error:
          "DEPARTMENT_HAS_DEPENDENCIES",
        usage: error.usage,
      },
      { status: 409 },
    );
  }

  if (error instanceof DepartmentServiceError) {
    const status =
      error.code === "DEPARTMENT_NAME_CONFLICT"
        ? 409
        : 404;

    return respond(
      { error: error.code },
      { status },
    );
  }

  if (error instanceof OrganizationServiceError) {
    const status =
      error.code === "ORGANIZATION_NAME_CONFLICT" ||
      error.code === "ORGANIZATION_HAS_COLLEGES"
        ? 409
        : 404;

    return respond(
      { error: error.code },
      { status },
    );
  }

  if (
    error instanceof
    CollegeHasDependenciesError
  ) {
    return respond(
      {
        error:
          "COLLEGE_HAS_DEPENDENCIES",
        usage: error.usage,
      },
      { status: 409 },
    );
  }

  if (error instanceof CollegeServiceError) {
    const status =
      error.code === "COLLEGE_CODE_CONFLICT"
        ? 409
        : 404;

    return respond(
      { error: error.code },
      { status },
    );
  }

  if (error instanceof AcademicsServiceError) {
    const notFound = new Set([
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
    ]);

    // AcademicsServiceError is not a permission decision by itself; only
    // explicit access-denied codes map to HTTP 403.
    const forbidden = new Set([
      "ACADEMICS_ACCESS_DENIED",
      "FACULTY_ACCESS_DENIED",
      "LEARNER_SCHEDULE_ACCESS_DENIED",
      "LEARNER_ROLE_REQUIRED",
      "FACULTY_ROLE_REQUIRED",
      "MEMBERSHIP_NOT_ACTIVE",
      "MEMBERSHIP_COLLEGE_MISMATCH",
    ]);

    return respond(
      { error: error.code },
      {
        status: notFound.has(error.code)
          ? 404
          : forbidden.has(error.code)
            ? 403
            : 409,
      },
    );
  }

  if (error instanceof CoursesServiceError) {
    const notFound = new Set([
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
    ]);

    const forbidden = new Set([
      "LEARNING_ACCESS_DENIED",
      "FACULTY_TEACHING_SCOPE_REQUIRED",
      "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
      "LEARNER_PROGRESS_ACCESS_DENIED",
      "DISCUSSION_POST_ACCESS_DENIED",
      "DISCUSSION_MODERATION_ACCESS_DENIED",
    ]);
    const badRequest = new Set([
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
    ]);

    const status = notFound.has(error.code)
      ? 404
      : forbidden.has(error.code)
        ? 403
        : badRequest.has(error.code)
          ? 400
          : 409;

    return respond(
      { error: error.code },
      { status },
    );
  }

  if (error instanceof ProjectsServiceError) {
    const notFound = new Set([
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
    ]);

    const forbidden = new Set([
      "PROJECT_ACCESS_DENIED",
      "PROJECT_LIFECYCLE_ACCESS_DENIED",
      "PROJECT_TASK_SUBMISSION_ACCESS_DENIED",
      "PROJECT_SUBMISSION_ACCESS_DENIED",
      "PROJECT_MEETING_ACCESS_DENIED",
    ]);

    return respond(
      { error: error.code },
      {
        status: notFound.has(error.code)
          ? 404
          : forbidden.has(error.code)
            ? 403
            : 409,
      },
    );
  }

  if (error instanceof PlacementsServiceError) {
    const notFound = new Set([
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
    ]);
    const forbidden = new Set([
      "PLACEMENT_DRIVE_DAY_ACCESS_DENIED",
      "PLACEMENT_DRIVE_DAY_ATTENDANCE_FORBIDDEN",
    ]);

    return respond(
      { error: error.code },
      {
        status: notFound.has(error.code)
          ? 404
          : forbidden.has(error.code)
            ? 403
            : 409,
      },
    );
  }

  if (error instanceof ActivityServiceError) {
    const notFound = new Set([
      "ACTIVITY_SCOPE_NOT_FOUND",
      "ACTIVITY_EVENT_NOT_FOUND",
      "NOTIFICATION_NOT_FOUND",
      "NOTIFICATION_RECIPIENT_NOT_FOUND",
    ]);
    return respond(
      { error: error.code },
      {
        status: notFound.has(error.code)
          ? 404
          : 409,
      },
    );
  }

  if (error instanceof AdminScopeServiceError) {
    return respond(
      { error: error.code },
      { status: 404 },
    );
  }

  if (error instanceof TenantDomainServiceError) {
    const status =
      error.code === "DOMAIN_NOT_FOUND" ||
      error.code === "COLLEGE_NOT_FOUND"
        ? 404
        : 409;

    return respond(
      { error: error.code },
      { status },
    );
  }

  if (error instanceof PeopleServiceError) {
    const status =
      error.code === "COLLEGE_NOT_FOUND" ||
      error.code === "MEMBERSHIP_NOT_FOUND" ||
      error.code === "DEPARTMENT_NOT_FOUND"
        ? 404
        : error.code === "ALTERNATE_PHONE_INVALID" ||
          error.code === "ALTERNATE_PHONE_SAME_AS_PRIMARY"
          ? 400
          : 409;

    return respond(
      { error: error.code },
      { status },
    );
  }

  const isOutage = isDatabaseUnavailableError(error);
  logError("api.unhandled_error", error, {
    component: "api",
    requestId,
  });

  return respond(
    { error: isOutage ? "DATABASE_UNAVAILABLE" : "INTERNAL_ERROR" },
    { status: isOutage ? 503 : 500 },
  );
}
