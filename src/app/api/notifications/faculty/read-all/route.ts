import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { markAllOwnFacultyNotificationsRead } from "@/modules/activity/faculty-notification-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const markedRead = await markAllOwnFacultyNotificationsRead(context);
    return NextResponse.json({ markedRead });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
