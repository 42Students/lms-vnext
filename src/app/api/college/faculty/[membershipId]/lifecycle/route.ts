import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { transitionCollegeFaculty } from "@/modules/people/college-faculty-lifecycle-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ membershipId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { membershipId } = await params;
    return NextResponse.json({
      membership: await transitionCollegeFaculty(context, membershipId, await request.json()),
    });
  } catch (error) { return apiErrorResponse(error); }
}
