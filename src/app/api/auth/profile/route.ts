import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getOwnIdentityProfile, updateOwnIdentityName } from "@/modules/people/identity-profile-service";

export const runtime="nodejs";
const input=z.strictObject({
 name:z.strictObject({
  givenName:z.string().trim().min(1).max(120),
  familyName:z.string().trim().max(120).default(""),
 }),
 expectedVersion:z.number().int().min(1),
});

/** Own identity only. No targetUserId, email or phone is accepted. */
export async function GET() {
 try {
  const profile=await getOwnIdentityProfile(await getCurrentRequestContext());
  return NextResponse.json({profile},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,
   headers:{"Cache-Control":"private, no-store"}});
 try{
  if(Number(request.headers.get("content-length")??0)>8192)
   return NextResponse.json({error:"REQUEST_TOO_LARGE"},{status:413,
    headers:{"Cache-Control":"private, no-store"}});
  const body=await request.text();
  if(body.length>8192)return NextResponse.json({error:"REQUEST_TOO_LARGE"},{status:413,
   headers:{"Cache-Control":"private, no-store"}});
  let raw:unknown;
  try{raw=JSON.parse(body);}
  catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400,
   headers:{"Cache-Control":"private, no-store"}});}
  const parsed=input.parse(raw);
  const profile=await updateOwnIdentityName(
   await getCurrentRequestContext(),parsed.name,parsed.expectedVersion);
  return NextResponse.json({profile},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
