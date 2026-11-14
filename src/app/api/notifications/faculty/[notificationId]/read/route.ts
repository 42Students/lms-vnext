import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { markOwnFacultyNotificationRead } from "@/modules/activity/faculty-notification-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { notificationId } = params;
    const notification = await markOwnFacultyNotificationRead(context, notificationId);
    return NextResponse.json({ notification });
  },
);
