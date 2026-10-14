import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { collegeStudentSectionOptions, moveCollegeStudentSection }
  from "@/modules/academics/college-student-section-move-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    return NextResponse.json(await collegeStudentSectionOptions(context, membershipId));
  } catch (error) { return apiErrorResponse(error); }
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
  } catch (error) { return apiErrorResponse(error); }
}
