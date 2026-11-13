import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { markFacultyAttendance } from "@/modules/attendance/faculty-service";
import { route } from "@/security/route";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ scheduleEventId: string }>;
};

async function handlePATCH(
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
    const body = await boundedRequestJson(request);
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
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePATCH(request as Parameters<typeof handlePATCH>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePATCH>[1]),
);

/** A modern POST alias for clients that retain the legacy bulk verb but use
 * the scoped UUID session path and current all-roster payload. Existing PATCH
 * callers are unchanged. Old numeric IDs cannot authorize an LMS membership.
 */
async function handlePOST(request:Request,context:RouteContext){
  return PATCH(request,context);
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
