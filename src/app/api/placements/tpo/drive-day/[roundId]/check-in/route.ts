import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { confirmTpoDriveDayCheckIn,TpoAttendanceStaleError } from "@/modules/placements/tpo-drive-day-checkin-service";
import { secured } from "@/security/secure-handler";
export const runtime = "nodejs";
async function handlePOST(request: Request, { params }: { params: Promise<{ roundId: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const { roundId } = await params;
    return NextResponse.json(await confirmTpoDriveDayCheckIn(context, roundId, await request.json()));
  } catch (error) {
    if(error instanceof TpoAttendanceStaleError)
      return NextResponse.json({error:"ATTENDANCE_STALE",
       message:"Attendance changed in another session. Refresh the roster and retry."},
       {status:409,headers:{"Cache-Control":"private, no-store"}});
    return apiErrorResponse(error);
  }
}
export const POST = secured(handlePOST, { csrf: "enforce" });
