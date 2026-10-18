import { NextResponse } from "next/server";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {privateAuthResponse} from "@/modules/auth/private-response";
import {
  listActiveSessions,
  revokeOtherSessions,
} from "@/modules/auth/session-service";

export const runtime = "nodejs";

/** The signed-in person's own live devices. Never anyone else's. */
export async function GET() {
  try {
    const session = await getCurrentDeviceSession();
    const rows = await listActiveSessions(session.userId);

    return NextResponse.json({
      devices: rows.map((row) => ({
        id: row.id,
        deviceName: row.device_name ?? null,
        userAgent: row.user_agent ?? null,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        current: row.id === session.sessionId,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}

/** "Sign out everywhere else": keeps only this device. */
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthResponse(NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 }));
  }

  try {
    const session = await getCurrentDeviceSession();
    const revoked = await revokeOtherSessions(
      session.userId,
      session.sessionId,
    );
    return NextResponse.json({ ok: true, revoked }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}
