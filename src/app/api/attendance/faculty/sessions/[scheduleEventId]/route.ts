import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { markFacultyAttendance } from "@/modules/attendance/faculty-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ scheduleEventId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const { scheduleEventId } = await params;
    const body = await request.json();
    const result = await markFacultyAttendance(
      context,
      scheduleEventId,
      body,
    );
    return NextResponse.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** A modern POST alias for clients that retain the legacy bulk verb but use
 * the scoped UUID session path and current all-roster payload. Existing PATCH
 * callers are unchanged. Old numeric IDs cannot authorize an LMS membership.
 */
export async function POST(request:Request,context:RouteContext){
  return PATCH(request,context);
}
