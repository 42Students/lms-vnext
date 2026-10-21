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

export async function POST(request: Request) {
  const startedAt = Date.now();
  const guarded = await guardLoginRequest(
    request,
    schema,
    "login-start",
    10,
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
    return loginErrorResponse(error, { route: "login-start", ip: guarded.ip });
  }
}
