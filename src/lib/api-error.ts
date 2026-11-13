import { NextResponse } from "next/server";
import { friendlyApiError } from "@/lib/friendly-error";
import { createRequestId } from "@/lib/request-id";
import { isDatabaseUnavailableError } from "@/lib/db-outage";
import { ZodError } from "zod";
import { RequestBodyError } from "@/lib/request-body";
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
import { TpoPublicJoinLinkError } from "@/modules/placements/tpo-public-join-link-service";
import { ActivityServiceError } from "@/modules/activity/errors";
import { StorageFileError } from "@/modules/storage/file-errors";
import { logError } from "@/observability/logger";
import {StudentRuleConflict} from "@/modules/module-access/admin-student-rule-write";
import {isPlainRoleDenial} from "@/lib/plain-role-denial";
import { AppError, statusForCode } from "@/lib/error-registry";

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
    const code = typeof body["error"] === "string" ? body["error"] : undefined;
    return NextResponse.json({
      ...body,
      // Teaching-scope denial is safe to explain without exposing a foreign
      // course. Other authorization failures intentionally remain generic.
      message: code === "PLACEMENT_APPLICATION_RATE_LIMITED"
        ? "Too many applications in the last minute. Please try again shortly."
        : code === "FACULTY_TEACHING_SCOPE_REQUIRED"
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
        issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 400 },
    );
  }

  if (error instanceof RequestBodyError) {
    return respond({ error: error.code }, { status: error.status });
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

  if (error instanceof AppError) {
    return respond(
      { error: error.code, ...(error.details ?? {}), ...(error.retryable ? { retryable: true } : {}) },
      { status: error.status },
    );
  }

  if (error instanceof DepartmentServiceError) return respond({ error: error.code }, { status: statusForCode("department", error.code) });

  if (error instanceof OrganizationServiceError) {
    return respond(
      { error: error.code, ...(error.code==="ORGANIZATION_HAS_COLLEGES"&&error.blockers?
        {blockers:error.blockers}:{}) },
      { status: statusForCode("organization", error.code) },
    );
  }

  if (error instanceof CollegeHasDependenciesError) {
    return respond({ error: "COLLEGE_HAS_DEPENDENCIES", usage: error.usage }, { status: 409 });
  }

  if (error instanceof CollegeServiceError) return respond({ error: error.code }, { status: statusForCode("college", error.code) });
  if (error instanceof AcademicsServiceError) return respond({ error: error.code }, { status: statusForCode("academics", error.code) });
  if (error instanceof CoursesServiceError) return respond({ error: error.code }, { status: statusForCode("courses", error.code) });
  if (error instanceof ProjectsServiceError) return respond({ error: error.code }, { status: statusForCode("projects", error.code) });

  if (error instanceof TpoPublicJoinLinkError && error.code === "NOT_FOUND") {
    return respond({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (error instanceof PlacementsServiceError) return respond({ error: error.code }, { status: statusForCode("placements", error.code) });
  if (error instanceof ActivityServiceError) return respond({ error: error.code }, { status: statusForCode("activity", error.code) });
  if (error instanceof AdminScopeServiceError) return respond({ error: error.code }, { status: statusForCode("adminScope", error.code) });
  if (error instanceof TenantDomainServiceError) return respond({ error: error.code }, { status: statusForCode("tenantDomain", error.code) });
  if (error instanceof PeopleServiceError) return respond({ error: error.code }, { status: statusForCode("people", error.code) });

  // Role refusals that older services throw as plain errors are denials (403), not server faults (500).
  if (isPlainRoleDenial(error)) {
    return respond({ error: "FORBIDDEN" }, { status: 403 });
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
