import { NextResponse } from "next/server";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import { MEMBERSHIP_COOKIE_NAME, ROLE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/auth/session";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {privateAuthResponse} from "@/modules/auth/private-response";
import {
  listActiveSessions,
  revokeAllOwnSessions,
  revokeOtherSessions,
} from "@/modules/auth/session-service";

export const runtime = "nodejs";

/** Legacy session migration map:
 * GET /sessions -> GET /api/auth/devices (current user only);
 * DELETE /sessions/{jti} -> DELETE /api/auth/devices/[sessionId];
 * POST /revoke-sessions -> DELETE /api/auth/devices?scope=all|others.
 * Cross-user staff revocation requires separate persisted admin permissions.
 * The new API deliberately withholds user IDs, raw JTI and IP addresses.
 */
/** The signed-in person's own live devices. Never anyone else's. */
export async function GET() {
  try {
    const session = await getCurrentDeviceSession();
    const rows = await listActiveSessions(session.userId);

    return NextResponse.json({
      devices: rows.map((row) => ({
        id: row["id"],
        deviceName: row["device_name"] ?? null,
        userAgent: row["user_agent"] ?? null,
        createdAt: row["created_at"],
        lastSeenAt: row["last_seen_at"],
        lastUsedAt: row["last_seen_at"],
        ipAddress: null, // privacy-preserving: never disclose raw IP
        expiresAt: row["expires_at"],
        current: row["id"] === session.sessionId,
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
    const response = privateAuthResponse(NextResponse.json({ ok: true, revoked,
      revokedCount:revoked,scope,currentExcluded:scope==="others",
      message:scope==="all"?"All sessions revoked":"Other sessions revoked",
      currentSessionRevoked:scope==="all" }, { headers: { "Cache-Control": "private, no-store" } }));
    if (scope === "all") {
      // The database has revoked the current device too. Immediately expire
      // every cookie that could preserve a stale selected role or tenant.
      // Keep the other-devices action signed in on this device.
      for (const name of [
        SESSION_COOKIE_NAME, MEMBERSHIP_COOKIE_NAME,
        ROLE_COOKIE_NAME, ADMIN_SCOPE_COOKIE_NAME,
      ]) {
        response.cookies.set(name, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }
      response.headers.set("Clear-Site-Data", '"storage"');
    }
    return response;
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}
