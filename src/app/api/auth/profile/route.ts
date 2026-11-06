import { NextResponse } from "next/server";
import { z } from "zod";
import { readBoundedAuthJson, AuthRequestBodyTooLarge } from "@/modules/auth/bounded-json";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getOwnIdentityProfile, updateOwnIdentityName } from "@/modules/people/identity-profile-service";
import { secured } from "@/security/secure-handler";

export const runtime="nodejs";
const input=z.strictObject({
 name:z.strictObject({
  givenName:z.string().trim().min(1).max(120),
  familyName:z.string().trim().max(120).default(""),
 }),
 expectedVersion:z.number().int().min(1),
});

/** Own identity only. No targetUserId, email or phone is accepted. */
async function handleGET() {
 try {
  const profile=await getOwnIdentityProfile(await getCurrentRequestContext());
  return NextResponse.json({profile},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
async function handlePATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,
   headers:{"Cache-Control":"private, no-store"}});
 try{
  // Decode only a bounded UTF-8 stream, even with missing or forged
  // Content-Length. request.text() buffers before checking a character count.
  let raw:unknown;
  try { raw=await readBoundedAuthJson(request,8_192); }
  catch(error) {
   const tooLarge=error instanceof AuthRequestBodyTooLarge;
   return NextResponse.json({error:tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST"},
    {status:tooLarge?413:400,headers:{"Cache-Control":"private, no-store"}});
  }
  const parsed=input.parse(raw);
  const profile=await updateOwnIdentityName(
   await getCurrentRequestContext(),parsed.name,parsed.expectedVersion);
  return NextResponse.json({profile},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH);
