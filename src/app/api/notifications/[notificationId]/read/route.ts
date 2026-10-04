import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { markOwnNotificationRead } from "@/modules/activity/notification-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function POST(
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
    const context =
      await getCurrentRequestContext();
    const { notificationId } =
      await params;
    const notification =
      await markOwnNotificationRead(
        context,
        notificationId,
      );
    return NextResponse.json({
      notification,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
