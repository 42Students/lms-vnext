import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseTpoNotificationReadBody } from "@/modules/activity/tpo-notifications-model";
import { markAllOwnTpoNotificationsRead } from "@/modules/activity/tpo-notifications-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    parseTpoNotificationReadBody(await request.text());
    const context = await getCurrentRequestContext();
    return NextResponse.json(await markAllOwnTpoNotificationsRead(context));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
