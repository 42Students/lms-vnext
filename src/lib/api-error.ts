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

  return NextResponse.json(
    { error: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
