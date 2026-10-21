import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { releaseDueStaffNotifications } from "@/modules/activity/notification-service";

export const runtime = "nodejs";

/**
 * Internal scheduling hook only. No user cookie/session authorizes this route.
 * Deployment must set NOTIFICATION_RELEASE_TOKEN; missing configuration fails
 * closed and cannot be bypassed by a same-origin browser request.
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_RELEASE_TOKEN;
  const authorization = request.headers.get("authorization");
  const incoming = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length) : null;
  if (!secret || !incoming) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const expected = Buffer.from(secret);
  const actual = Buffer.from(incoming);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const result = await releaseDueStaffNotifications();
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
