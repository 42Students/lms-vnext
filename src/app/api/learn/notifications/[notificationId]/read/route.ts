import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { markOwnLearnerNotificationRead } from "@/modules/activity/learner-notification-read-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { notificationId } = await params;
    const notification = await markOwnLearnerNotificationRead(context, notificationId);
    return NextResponse.json({ notification });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
