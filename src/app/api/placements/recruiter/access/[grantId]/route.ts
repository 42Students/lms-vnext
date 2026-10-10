import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { leaveOwnRecruiterCollegeAccess } from "@/modules/placements/recruiter-profile-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ grantId: string }> };

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { grantId } = await params;
    return NextResponse.json({
      access: await leaveOwnRecruiterCollegeAccess(context, grantId),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
