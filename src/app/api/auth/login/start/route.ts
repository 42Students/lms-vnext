import { NextResponse } from "next/server";
import { z } from "zod";
import {privateAuthResponse} from "@/modules/auth/private-response";
import {
  guardLoginRequest,
  auditLogin,
  ipTag,
  loginErrorResponse,
} from "@/modules/auth/http";
import { startLoginWithRuntime } from "@/modules/auth/runtime";

export const runtime = "nodejs";

const schema = z.strictObject({
  channel: z.enum(["PHONE", "EMAIL"]),
  contact: z.string().min(3).max(254),
});

export async function POST(request: Request) {
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-start",
    10,
  );
  if (!guarded.ok) return guarded.response;

  try {
    const result = await startLoginWithRuntime({
      channel: guarded.body.channel,
      contact: guarded.body.contact,
      tenantCollegeId: guarded.tenantCollegeId,
      ipTag: ipTag(guarded.ip),
    });
    auditLogin("auth.login_started", { route: "login-start", ip: guarded.ip }, {
      channel: result.channel,
      requiresSecondFactor: result.requiresSecondFactor,
    });
    // The legacy first OTP step acknowledged "OTP triggered"; retain that
    // copy as an additive alias without disclosing which accounts, roles or
    // colleges share this contact. Verification issues a first-party session
    // cookie; only afterwards may the user choose a permitted membership.
    // Native clients must use an approved cookie-capable first-party flow:
    // this endpoint is NOT a bearer-token or cross-domain handoff service.
    return privateAuthResponse(NextResponse.json({
      ...result,
      message: "OTP triggered",
      nextStep: "VERIFY_CODE",
    }));
  } catch (error) {
    return loginErrorResponse(error, { route: "login-start", ip: guarded.ip });
  }
}
