import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnNotifications } from "@/modules/activity/notification-service";

export const runtime = "nodejs";

export async function GET(
  request: Request,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const params = new URL(
      request.url,
    ).searchParams;
    const unreadOnly =
      params.get("unreadOnly") ===
      "true";
    const limit =
      params.get("limit") ?? "40";
    const rows =
      await listOwnNotifications(
        context,
        {
          unreadOnly,
          limit: Number(limit),
        },
      );

    return NextResponse.json({
      notifications: rows,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
