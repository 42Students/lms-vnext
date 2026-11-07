import { NextResponse } from "next/server";
import { privateAuthResponse } from "@/modules/auth/private-response";
import { auditLogin, guardLoginRequest, ipTag, loginErrorResponse } from "@/modules/auth/http";
import {
  rollNumberStartSchema, startLearnerRollNumberLogin,
} from "@/modules/auth/roll-number-login-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
async function handlePOST(request: Request) {
  const guarded = await guardLoginRequest(request, rollNumberStartSchema,
    "roll-number-login-start", 6);
  if (!guarded.ok) return guarded.response;
  try {
    const result = await startLearnerRollNumberLogin(
      guarded.body, guarded.tenantCollegeId, ipTag(guarded.ip));
    auditLogin("auth.learner_roll_login_started", {
      route: "roll-number-login-start", ip: guarded.ip,
    }, { channel: result.channel });
    return privateAuthResponse(NextResponse.json({
      ...result, message: "OTP triggered", nextStep: "VERIFY_CODE",
    }));
  } catch (error) {
    return loginErrorResponse(error, {
      route: "roll-number-login-start", ip: guarded.ip,
    });
  }
}
export const POST = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
