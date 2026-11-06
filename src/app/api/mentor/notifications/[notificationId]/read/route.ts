import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseMentorNotificationReadBody } from "@/modules/activity/mentor-notification-read-input";
import { markOwnMentorNotificationRead } from "@/modules/activity/mentor-notification-read-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{notificationId:string}>};
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    parseMentorNotificationReadBody(await request.text());
    const {notificationId}=params;
    const notification=await markOwnMentorNotificationRead(context,notificationId);
    return NextResponse.json({notification});
  },
);
