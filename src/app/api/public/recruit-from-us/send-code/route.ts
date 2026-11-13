import { NextResponse } from "next/server";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { isSameOriginRequest } from "@/auth/origin";
import { sendPublicEnquiryCode,PublicEnquiryError } from "@/modules/placements/public-enquiry/send-service";
import {readPublicRecruitEnquiryBody} from "@/modules/placements/public-enquiry/body-model";
import { route } from "@/security/route";
import { featureReady } from "@/config/features";
import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 let tenant:Awaited<ReturnType<typeof resolveRequestTenant>>;
 try {tenant=await resolveRequestTenant(request.headers.get("host"));}
 catch {return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
  {status:503,headers:{"Cache-Control":CACHE.NONE}});}
 if(tenant.kind!=="college")return NextResponse.json({error:"PAGE_UNAVAILABLE"},{status:404});
 const body=await readPublicRecruitEnquiryBody(request);
 if(body.kind!=="OK")return NextResponse.json({error:body.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"COULD_NOT_SEND_CODE"},
  {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.NONE}});
 const ip=featureReady("publicJoinTrustedProxy")
  ?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const result=await sendPublicEnquiryCode(tenant.collegeId,body.value,ip);
  return noStoreJson(result);
 }catch(error){
  if(error instanceof PublicEnquiryError)return NextResponse.json({
   error:error.code==="NOT_READY"?"RECRUITER_ENQUIRIES_UNAVAILABLE":
    error.code==="LIMIT"?"TOO_MANY_TRIES":"COULD_NOT_SEND_CODE",
  },{status:error.code==="NOT_READY"?503:error.code==="LIMIT"?429:400,
    headers:{"Cache-Control":CACHE.NONE}});
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
   {status:503,headers:{"Cache-Control":CACHE.NONE}});
 }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
