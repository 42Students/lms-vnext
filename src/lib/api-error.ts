import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SessionAuthenticationError } from "@/auth/session";
import { ContextResolutionError } from "@/modules/identity/context-service";
import { AuthorizationError } from "@/modules/permissions/policy";
import { DepartmentServiceError } from "@/modules/departments/service";
import { OrganizationServiceError } from "@/modules/organizations/service";
import { CollegeServiceError } from "@/modules/colleges/service";
import { PeopleServiceError } from "@/modules/people/errors";
import { TenantDomainServiceError } from "@/modules/tenant-domains/service";
import { AdminScopeServiceError } from "@/modules/admin-scope/service";
import { AcademicsServiceError } from "@/modules/academics/errors";
import { CoursesServiceError } from "@/modules/courses/errors";
import { ProjectsServiceError } from "@/modules/projects/errors";
import { logError } from "@/observability/logger";

export function apiErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", issues: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof SessionAuthenticationError) {
    return NextResponse.json(
      { error: error.code },
      { status: 401 },
    );
  }

  if (error instanceof ContextResolutionError) {
    return NextResponse.json(
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

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 },
    );
  }

  if (error instanceof DepartmentServiceError) {
    const status =
      error.code === "DEPARTMENT_NAME_CONFLICT"
        ? 409
        : 404;

    return NextResponse.json(
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

    return NextResponse.json(
      { error: error.code },
      { status },
    );
  }

  if (error instanceof CollegeServiceError) {
    const status =
      error.code === "COLLEGE_CODE_CONFLICT"
        ? 409
        : 404;

    return NextResponse.json(
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

    return NextResponse.json(
      { error: error.code },
      { status: notFound.has(error.code) ? 404 : 409 },
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
    ]);

    const forbidden = new Set([
      "LEARNING_ACCESS_DENIED",
      "FACULTY_TEACHING_SCOPE_REQUIRED",
      "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
      "LEARNER_PROGRESS_ACCESS_DENIED",
    ]);
    const badRequest = new Set([
      "CONTENT_TYPE_SHAPE_INVALID",
      "TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED",
      "CONTENT_DURATION_REQUIRED",
      "LIVE_CLASS_NOT_FINISHED",
      "ASSIGNMENT_GRADE_INVALID",
      "QUIZ_QUESTION_INVALID",
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

    return NextResponse.json(
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
    ]);

    const forbidden = new Set([
      "PROJECT_ACCESS_DENIED",
      "PROJECT_LIFECYCLE_ACCESS_DENIED",
      "PROJECT_TASK_SUBMISSION_ACCESS_DENIED",
      "PROJECT_SUBMISSION_ACCESS_DENIED",
    ]);

    return NextResponse.json(
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

  if (error instanceof AdminScopeServiceError) {
    return NextResponse.json(
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

    return NextResponse.json(
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
        : 409;

    return NextResponse.json(
      { error: error.code },
      { status },
    );
  }

  logError("api.unhandled_error", error, {
    component: "api",
  });

  return NextResponse.json(
    { error: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
