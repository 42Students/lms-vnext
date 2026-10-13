import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import {
  MEMBERSHIP_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/auth/session";
import {
  guardLoginRequest,
  loginErrorResponse,
} from "@/modules/auth/http";
import { verifyLoginWithRuntime } from "@/modules/auth/runtime";
import { createSession } from "@/modules/auth/session-service";

export const runtime = "nodejs";

const schema = z.object({
  attemptId: z.string().uuid(),
  code: z.string().regex(/^[0-9]{4,8}$/),
  secondCode: z
    .string()
    .regex(/^[0-9]{4,8}$/)
    .optional(),
});

export async function POST(request: Request) {
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-verify",
    10,
  );
  if (!guarded.ok) return guarded.response;

  try {
    const verified = await verifyLoginWithRuntime({
      attemptId: guarded.body.attemptId,
      code: guarded.body.code,
      secondCode: guarded.body.secondCode,
      tenantCollegeId: guarded.tenantCollegeId,
    });

    const session = await createSession(verified.user.id, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: guarded.ip,
    });

    const active = verified.memberships.filter(
      (membership) => membership.status === "ACTIVE",
    );
    // A college host fixes the college; otherwise a person with exactly one
    // active college (and no platform role) skips the chooser.
    const autoMembershipId =
      verified.tenantMembershipId ??
      (!verified.isSuperAdmin && active.length === 1
        ? active[0].id
        : null);

    const base = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    const response = NextResponse.json({
      ok: true,
      next: "/dashboard",
      selectedMembership: Boolean(autoMembershipId),
    });
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      ...base,
      maxAge: session.maxAgeSeconds,
    });
    // Never carry a previous person's college or admin scope forward.
    response.cookies.set(ADMIN_SCOPE_COOKIE_NAME, "", {
      ...base,
      maxAge: 0,
    });
    response.cookies.set(
      MEMBERSHIP_COOKIE_NAME,
      autoMembershipId ?? "",
      {
        ...base,
        maxAge: autoMembershipId ? session.maxAgeSeconds : 0,
      },
    );
    return response;
  } catch (error) {
    return loginErrorResponse(error);
  }
}
