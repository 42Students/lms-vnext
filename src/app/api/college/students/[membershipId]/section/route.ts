import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeStudentSectionOptions, moveCollegeStudentSection, CollegeStudentSectionMoveError }
  from "@/modules/academics/college-student-section-move-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const context = __actor!;
    try {
const { membershipId } = params;
return NextResponse.json(await collegeStudentSectionOptions(context, membershipId));
} catch (error) {
    if (error instanceof CollegeStudentSectionMoveError) {
      return NextResponse.json(
        { error: error.code === "STUDENT_NOT_FOUND" ? "NOT_FOUND" : error.code },
        { status: error.code === "STUDENT_NOT_FOUND" ? 404 : 409 },
      );
    }
    return apiErrorResponse(error);
  }
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { membershipId } = params;
return NextResponse.json(await moveCollegeStudentSection(
      context, membershipId, await request.json(),
    ));
} catch (error) {
    if (error instanceof CollegeStudentSectionMoveError) {
      return NextResponse.json(
        { error: error.code === "STUDENT_NOT_FOUND" ? "NOT_FOUND" : error.code },
        { status: error.code === "STUDENT_NOT_FOUND" ? 404 : 409 },
      );
    }
    return apiErrorResponse(error);
  }
  },
);
