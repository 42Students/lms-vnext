import { NextResponse } from "next/server";
import { releaseDueStaffNotifications } from "@/modules/activity/notification-service";
import { internalRoute } from "@/security/internal-route";

import { jobCredential } from "@/security/jobs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Internal scheduling hook only. A first-party session cannot authorize it:
 * the dedicated deployment credential must be high entropy and at least
 * 32 UTF-8 bytes long. No client may select the job or its parameters.
 */
export const POST = internalRoute(
  {
    name: "internal.notifications.release",
    credential: jobCredential("internal.notifications.release"),
    emptyBody: true,
    denied: { status: 401, body: { error: "UNAUTHORIZED" } },
    invalid: { error: "INVALID_REQUEST" },
  },
  async () => {
    try {
      return NextResponse.json(await releaseDueStaffNotifications());
    } catch {
      // Do not disclose DB, recipient or provider failure details to callers.
      return NextResponse.json({ error: "NOTIFICATION_RELEASE_UNAVAILABLE" }, { status: 503 });
    }
  },
);
