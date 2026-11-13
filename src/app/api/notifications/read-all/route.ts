import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { markAllOwnNotificationsRead } from "@/modules/activity/notification-service";
import { markAllOwnLearnerNotificationsRead } from "@/modules/activity/learner-notification-read-service";

import { ROLE } from "@/modules/identity/roles";
export const runtime = "nodejs";

/** Only the authenticated recipient may acknowledge their own unread inbox. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const markedRead = context.membership?.roles.includes(ROLE.LEARNER)
      ? await markAllOwnLearnerNotificationsRead(context)
      : await markAllOwnNotificationsRead(context);
    return NextResponse.json({ markedRead });
  },
);
