import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getAdminCurrentAttendanceRecord } from "@/modules/attendance/admin-service";

export const runtime = "nodejs";

/** Scopes both event and learner through the selected college delivery. */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const search = new URL(request.url).searchParams;
    const record = await getAdminCurrentAttendanceRecord(context, {
      collegeId: search.get("collegeId"),
      deliveryId: search.get("deliveryId"),
      scheduleEventId: search.get("scheduleEventId"),
      membershipId: search.get("membershipId"),
    });
    return NextResponse.json(record, {
      headers: {"Cache-Control":"private, no-store"},
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
