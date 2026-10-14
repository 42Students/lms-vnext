import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeStudentSectionOptions, moveCollegeStudentSection, CollegeStudentSectionMoveError }
  from "@/modules/academics/college-student-section-move-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
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
}
export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json(
    { error: "INVALID_ORIGIN" }, { status: 403 },
  );
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
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
}
