import { NextResponse } from "next/server";
import { z } from "zod";
import {privateAuthResponse} from "@/modules/auth/private-response";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import {
  MEMBERSHIP_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/auth/session";
import {
  guardLoginRequest,
  auditLogin,
  loginErrorResponse,
} from "@/modules/auth/http";
import { verifyLoginWithRuntime } from "@/modules/auth/runtime";
import { getAuthConfig } from "@/modules/auth/config";

export const runtime = "nodejs";

// Old GET /verifyOTP exposed secrets in URL logs. Only a guarded POST attempt
// may verify now. An old POST client can send 'otp' while it migrates to 'code'.
// The server never issues a legacy JWT pair or a synthetic E2E administrator.
const loginOtp = z.string().trim().regex(/^[0-9]{4,8}$/, "Enter the 4-8 digit OTP");
const schema = z.strictObject({
  attemptId: z.string({ error: "attemptId required" }).trim()
    .min(1, "attemptId required").uuid("Invalid attemptId"),
  code: loginOtp.optional(),
  otp: loginOtp.optional(),
  secondCode: z.string().trim()
    .regex(/^[0-9]{4,8}$/, "Enter the 4-8 digit second verification code")
    .optional(),
}).superRefine((data,ctx)=>{
  if(!data.code&&!data.otp)ctx.addIssue({
    code:"custom",path:["code"],message:"otp required",
  });
  if(data.code&&data.otp&&data.code!==data.otp)ctx.addIssue({
    code:"custom",path:["otp"],message:"The two supplied OTP values must match",
  });
});

function previousToken(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return rest.join("=") || null;
  }
  return null;
}

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
      code: guarded.body.code ?? guarded.body.otp!,
      secondCode: guarded.body.secondCode,
      tenantCollegeId: guarded.tenantCollegeId,
      // Session is created in the same transaction as the code consume, and
      // any session cookie being replaced is revoked there too.
      session: {
        userAgent: request.headers.get("user-agent"),
        ipAddress: guarded.ip,
        maxAgeSeconds: getAuthConfig().sessionMaxAgeSeconds,
        previousToken: previousToken(request),
      },
    });
    const session = verified.session;
    if (!session) throw new Error("session was not issued");

    auditLogin("auth.login_succeeded", { route: "login-verify", ip: guarded.ip }, {
      userId: verified.user.id,
      isSuperAdmin: verified.isSuperAdmin,
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
      // Return next-step hints, never the legacy auth token pair.
      // Discover roles and colleges only over the authenticated cookie.
      membershipSelectionRequired: !autoMembershipId,
      // Migration hint for old clients that formerly received memberships,
      // host policy flags and bearer tokens in the verify response.
      // Clients must use the new cookie-scoped endpoints after verification.
      nextAction: autoMembershipId ? "OPEN_DASHBOARD" : "SELECT_COLLEGE_AND_ROLE",
      loginProtocol: "COOKIE_SESSION_V2",
      verificationMethod: "POST_ATTEMPT_ID_CODE",
      membershipsEndpoint: "/api/auth/memberships",
      sessionEndpoint: "/api/auth/session",
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
    return privateAuthResponse(response);
  } catch (error) {
    return loginErrorResponse(error, { route: "login-verify", ip: guarded.ip });
  }
}
