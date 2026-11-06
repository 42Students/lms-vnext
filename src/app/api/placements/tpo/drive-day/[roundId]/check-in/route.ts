import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { confirmTpoDriveDayCheckIn,TpoAttendanceStaleError } from "@/modules/placements/tpo-drive-day-checkin-service";
export const runtime = "nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { roundId } = params;
    return NextResponse.json(await confirmTpoDriveDayCheckIn(context, roundId, await request.json()));
  },
);
