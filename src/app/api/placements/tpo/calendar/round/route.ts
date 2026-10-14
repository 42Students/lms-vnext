import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { decideTpoCalendarRound } from "@/modules/placements/tpo-round-calendar-service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    return NextResponse.json({ round: await decideTpoCalendarRound(
      await getCurrentRequestContext(), await request.json(),
    ) });
  } catch (error) { return apiErrorResponse(error); }
}
