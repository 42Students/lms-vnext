import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readBoundedAuthJson, AuthRequestBodyTooLarge } from "@/lib/request-body";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getOwnIdentityProfile, updateOwnIdentityName } from "@/modules/people/identity-profile-service";

import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
const input=z.strictObject({
 name:z.strictObject({
  givenName:z.string().trim().min(1).max(120),
  familyName:z.string().trim().max(120).default(""),
 }),
 expectedVersion:z.number().int().min(1),
});

/** Own identity only. No targetUserId, email or phone is accepted. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const profile=await getOwnIdentityProfile(__ctx);
    return privateJson({profile});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    let raw:unknown;
    try { raw=await readBoundedAuthJson(request,8_192); }
  catch(error) {
   const tooLarge=error instanceof AuthRequestBodyTooLarge;
   return NextResponse.json({error:tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST"},
    {status:tooLarge?413:400,headers:{"Cache-Control":CACHE.PRIVATE}});
  }
    const parsed=input.parse(raw);
    const profile=await updateOwnIdentityName(
   __ctx,parsed.name,parsed.expectedVersion);
    return privateJson({profile});
  },
);
