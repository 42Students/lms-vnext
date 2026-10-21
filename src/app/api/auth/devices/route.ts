import { NextResponse } from "next/server";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {privateAuthResponse} from "@/modules/auth/private-response";
import {
  listActiveSessions,
  revokeAllOwnSessions,
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

/** Own-session actions only; never infer a target person from caller JSON.
 * Legacy staff-wide revocation is deliberately not exposed from a self-device
 * route: cross-account revocation requires a separately authorized admin
 * workflow and persisted permission check. scope=all revokes this device too.
 */
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateAuthResponse(NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 }));
  }

  try {
    const scope = new URL(request.url).searchParams.get("scope") ?? "others";
    if(scope!=="others"&&scope!=="all")
      return privateAuthResponse(NextResponse.json({error:"INVALID_REQUEST"},{status:400}));
    const session = await getCurrentDeviceSession();
    const revoked = scope==="all"
      ? await revokeAllOwnSessions(session.userId)
      : await revokeOtherSessions(session.userId,session.sessionId);
    return privateAuthResponse(NextResponse.json({ ok: true, revoked,
      currentSessionRevoked:scope==="all" }, { headers: { "Cache-Control": "private, no-store" } }));
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}
