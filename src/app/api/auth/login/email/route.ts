import { NextResponse } from "next/server";
import { z } from "zod";
import {privateAuthResponse,privateAuthJson} from "@/modules/auth/private-response";
import {
  guardLoginRequest,
  auditLogin,
  loginErrorResponse,
} from "@/modules/auth/http";
import { sendEmailFallbackWithRuntime } from "@/modules/auth/runtime";

export const runtime = "nodejs";

/** Migration contract:
 * Legacy POST /email-fallback/send with { attemptId } now calls
 * POST /api/auth/login/email with { attemptId: "<current challenge UUID>" }.
 * Its EMAIL_OTP_SENT response carries a maskedEmail and expiresInSeconds.
 * Legacy /email-fallback/verify is POST /api/auth/login/verify with
 * { attemptId, code } (not the old "otp" key). A successful verify sets an
 * HttpOnly session cookie and may ask for college/role selection.
 * Old opaque attempt IDs must restart at /api/auth/login/start.
 */
const schema = z.strictObject({ attemptId: z.string().trim().nullish() });
const challengeIdSchema = z.string().uuid();

export async function POST(request: Request) {
  const startedAt=Date.now();
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-email",
    6,
  );
  if (!guarded.ok) return guarded.response;
  const candidate=guarded.body.attemptId ?? "";
  if (!candidate) {
    return privateAuthJson({
      error:"ATTEMPT_ID_REQUIRED",message:"attemptId required",
    },{status:400});
  }
  const parsedId=challengeIdSchema.safeParse(candidate);
  if (!parsedId.success){
    return privateAuthJson({
      error:"INVALID_ATTEMPT_ID",
      message:"This sign-in attempt is no longer supported. Start a new sign-in attempt.",
    },{status:400});
  }
  // Retry-After for TOO_SOON comes from loginErrorResponse/LoginError;
  // never guess the server challenge store's backoff interval.

  try {
    const result = await sendEmailFallbackWithRuntime({
      attemptId: parsedId.data,
      tenantCollegeId: guarded.tenantCollegeId,
    });
    auditLogin("auth.email_code_sent", { route: "login-email", ip: guarded.ip },
      {elapsedMs:Date.now()-startedAt});
    return privateAuthResponse(NextResponse.json({
      ...result,mode:"EMAIL_OTP_SENT" as const,
      nextStep:"VERIFY_CODE" as const,
      verifyEndpoint:"/api/auth/login/verify",
      verifyCodeField:"code" as const,
    }));
  } catch (error) {
    auditLogin("auth.email_fallback_failed",{route:"login-email",ip:guarded.ip},
      {elapsedMs:Date.now()-startedAt});
    return loginErrorResponse(error, { route: "login-email", ip: guarded.ip });
  }
}
