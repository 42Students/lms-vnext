import { NextResponse } from "next/server";
import { privateAuthResponse } from "@/modules/auth/private-response";
import { auditLogin, guardLoginRequest, ipTag, loginErrorResponse } from "@/modules/auth/http";
import {
  rollNumberStartSchema, startLearnerRollNumberLogin,
} from "@/modules/auth/roll-number-login-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
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
