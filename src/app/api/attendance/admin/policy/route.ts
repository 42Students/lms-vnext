import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  updateCollegeAttendancePolicy,
} from "@/modules/attendance/policy-service";

export const runtime = "nodejs";

/**
 * Both policy fields are updated together.
 * Origin protection is mandatory because this
 * route changes state using a browser session.
 */
export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const body = await request.json();

    const policy =
      await updateCollegeAttendancePolicy(
        context,
        body,
      );

    return NextResponse.json({ policy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
