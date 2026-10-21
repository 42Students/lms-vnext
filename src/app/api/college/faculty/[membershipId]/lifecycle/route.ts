import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { transitionCollegeFaculty, CollegeFacultyLifecycleError } from "@/modules/people/college-faculty-lifecycle-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    const membership = await transitionCollegeFaculty(context, membershipId, await request.json());
    // Keep the membership-scoped identity model while exposing the legacy
    // row-refresh fields to all lifecycle callers.
    return NextResponse.json({
      membership,
      membershipId: membership.id,
      scope: "COLLEGE_MEMBERSHIP",
      status: membership.status,
      suspendedAt: membership.suspendedAt,
      suspensionReason: membership.suspensionReason,
    });
  } catch (error) {
    if (error instanceof CollegeFacultyLifecycleError) {
      return NextResponse.json(
        {
          error: error.code === "FACULTY_NOT_FOUND" ? "NOT_FOUND" : error.code,
          ...(error.code === "FACULTY_NOT_FOUND" ? { message: "Not found" } : {}),
          ...(error.code === "FACULTY_HAS_ACTIVE_PROJECTS" ? {
            message: error.message,
            activeMentorProjects: error.activeMentorProjects,
          } : {}),
        },
        { status: error.code === "FACULTY_NOT_FOUND" ? 404 : 409 },
      );
    }
    return apiErrorResponse(error);
  }
}
