import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { confirmTpoDriveDayCheckIn,TpoAttendanceStaleError } from "@/modules/placements/tpo-drive-day-checkin-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { roundId } = params;
return NextResponse.json(await confirmTpoDriveDayCheckIn(context, roundId, await request.json()));
} catch (error) {
    if(error instanceof TpoAttendanceStaleError)
      return NextResponse.json({error:"ATTENDANCE_STALE",
       message:"Attendance changed in another session. Refresh the roster and retry."},
       {status:409,headers:{"Cache-Control":"private, no-store"}});
    return apiErrorResponse(error);
  }
  },
);
