import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getAttendanceParentSmsReadiness } from "@/modules/attendance/parent-sms-service";

export const runtime = "nodejs";

/** Returns consent state only. Phone, evidence reference and SMS body stay private. */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const search = new URL(request.url).searchParams;
    const status = await getAttendanceParentSmsReadiness(context, {
      collegeId: search.get("collegeId"),
      membershipId: search.get("membershipId"),
    });
    return NextResponse.json(status, {
      headers: {"Cache-Control":"private, no-store"},
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
