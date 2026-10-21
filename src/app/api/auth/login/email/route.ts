import { NextResponse } from "next/server";
import { z } from "zod";
import {privateAuthResponse} from "@/modules/auth/private-response";
import {
  guardLoginRequest,
  auditLogin,
  loginErrorResponse,
} from "@/modules/auth/http";
import { sendEmailFallbackWithRuntime } from "@/modules/auth/runtime";

export const runtime = "nodejs";

const schema = z.strictObject({ attemptId: z.string().uuid() });

export async function POST(request: Request) {
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-email",
    6,
  );
  if (!guarded.ok) return guarded.response;
  // The shared guard intentionally rejects malformed IDs before any challenge lookup.
  // Retry-After for TOO_SOON comes from loginErrorResponse/LoginError and is
  // computed by the challenge store; do not fabricate a fixed countdown here.

  try {
    const result = await sendEmailFallbackWithRuntime({
      attemptId: guarded.body.attemptId,
      tenantCollegeId: guarded.tenantCollegeId,
    });
    auditLogin("auth.email_code_sent", { route: "login-email", ip: guarded.ip });
    return privateAuthResponse(NextResponse.json(result));
  } catch (error) {
    return loginErrorResponse(error, { route: "login-email", ip: guarded.ip });
  }
}
