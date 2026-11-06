import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { parseTpoNotificationReadBody } from "@/modules/activity/tpo-notifications-model";
import { markOwnTpoNotificationRead } from "@/modules/activity/tpo-notifications-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    parseTpoNotificationReadBody(await request.text());
    const { notificationId } = params;
    const notification = await markOwnTpoNotificationRead(context, notificationId);
    return NextResponse.json({ notification });
  },
);
