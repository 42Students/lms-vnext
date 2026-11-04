import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { releaseDueStaffNotifications } from "@/modules/activity/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" } as const;

/**
 * Internal scheduling hook only. A first-party session cannot authorize it:
 * the dedicated deployment credential must be high entropy and at least
 * 32 UTF-8 bytes long. No client may select the job or its parameters.
 */
export async function POST(request: Request) {
  // Machine-to-machine calls must not be initiated through a browser.
  if (request.headers.has("origin")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: noStore });
  }
  const secret = process.env["NOTIFICATION_RELEASE_TOKEN"];
  const authorization = request.headers.get("authorization");
  const incoming = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length) : null;
  if (!secret || !incoming || Buffer.byteLength(secret, "utf8") < 32) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: noStore });
  }
  const expected = Buffer.from(secret, "utf8");
  const actual = Buffer.from(incoming, "utf8");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: noStore });
  }
  if (new URL(request.url).search) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  }
  // Stream-based rejection prevents clients from hiding a body behind a
  // forged Content-Length header. A scheduler POST intentionally has no body.
  const body = await readBoundedUtf8Body(request, 0);
  if (body.kind !== "OK" || body.body !== "") {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers: noStore });
  }
  try {
    const result = await releaseDueStaffNotifications();
    return NextResponse.json(result, { headers: noStore });
  } catch {
    // Do not disclose DB, recipient or provider failure details to callers.
    return NextResponse.json({ error: "NOTIFICATION_RELEASE_UNAVAILABLE" },
      { status: 503, headers: noStore });
  }
}
