import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { markOwnLearnerNotificationRead } from "@/modules/activity/learner-notification-read-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { notificationId } = params;
    const notification = await markOwnLearnerNotificationRead(context, notificationId);
    return NextResponse.json({ notification });
  },
);
