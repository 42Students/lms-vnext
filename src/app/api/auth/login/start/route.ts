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
import { route } from "@/security/route";
import { LOGIN_START_PER_IP_PER_MINUTE } from "@/modules/auth/ip-limits";
import { decoyStartResult, isMaskedStartError, padToFloor, uniformStartEnabled } from "@/modules/auth/uniform-start";

import { RATE_LIMITS } from "@/security/limits";
export const runtime = "nodejs";

// The canonical request is {channel,contact}. Legacy POST-only callers may
// still supply email, phone or phoneNumber while moving to the new contract.
// No GET query-string contact/OTP or bearer-token protocol is reintroduced.
const schema = z.strictObject({
  channel: z.enum(["PHONE", "EMAIL"]).optional(),
  contact: z.string().trim().min(3,"Contact required").max(254,"Contact is too long").optional(),
  email: z.string({error:"email must be a string"}).trim()
    .min(1,"Email required").max(254,"Email is too long").optional(),
  phone: z.string({error:"phone must be a string"}).trim().optional(),
  phoneNumber: z.string({error:"phone must be a string"}).trim().optional(),
}).superRefine((input,ctx)=>{
  const channel=input.channel ?? (input.email?"EMAIL":"PHONE");
  const legacyContact=channel==="EMAIL"?input.email:(input.phone??input.phoneNumber);
  const contact=input.contact??legacyContact;
  if(!contact)ctx.addIssue({
    code:"custom",path:["contact"],message:channel==="PHONE"?"Phone required":"Email required",
  });
  if(input.contact&&legacyContact&&input.contact!==legacyContact)ctx.addIssue({
    code:"custom",path:["contact"],message:"Conflicting contact fields",
  });
  if(input.channel==="EMAIL"&&(input.phone||input.phoneNumber)||
     input.channel==="PHONE"&&input.email)ctx.addIssue({
    code:"custom",path:["channel"],message:"Contact does not match login channel",
  });
});

async function handlePOST(request: Request) {
  const startedAt = Date.now();
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-start",
    LOGIN_START_PER_IP_PER_MINUTE,
  );
  if (!guarded.ok) return guarded.response;

  try {
    const channel = guarded.body.channel ?? (guarded.body.email ? "EMAIL" : "PHONE");
    const contact = guarded.body.contact ??
      (channel === "EMAIL" ? guarded.body.email : guarded.body.phone ?? guarded.body.phoneNumber);
    if (!contact) throw new Error("Contact required");
    const result = await startLoginWithRuntime({
      channel,
      contact,
      tenantCollegeId: guarded.tenantCollegeId,
      ipTag: ipTag(guarded.ip),
    });
    auditLogin("auth.login_started", { route: "login-start", ip: guarded.ip }, {
      channel: result.channel,
      requiresSecondFactor: result.requiresSecondFactor,
      durationMs: Date.now() - startedAt,
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
    if (uniformStartEnabled() && isMaskedStartError(error)) {
      const channel = guarded.body.channel ?? (guarded.body.email ? "EMAIL" : "PHONE");
      const contact = guarded.body.contact ??
        (channel === "EMAIL" ? guarded.body.email : guarded.body.phone ?? guarded.body.phoneNumber) ?? "";
      auditLogin("auth.login_start_masked", { route: "login-start", ip: guarded.ip }, { code: error.code });
      await padToFloor(startedAt);
      return privateAuthResponse(NextResponse.json({
        ...decoyStartResult(channel, contact),
        message: "OTP triggered",
        nextStep: "VERIFY_CODE",
      }));
    }
    return loginErrorResponse(error, { route: "login-start", ip: guarded.ip });
  }
}
export const POST = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: RATE_LIMITS.BULK },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
