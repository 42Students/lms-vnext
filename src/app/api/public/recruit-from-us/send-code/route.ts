import { NextResponse } from "next/server";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { isSameOriginRequest } from "@/auth/origin";
import { sendPublicEnquiryCode,PublicEnquiryError } from "@/modules/placements/public-enquiry/send-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const tenant=await resolveRequestTenant(request.headers.get("host"));
 if(tenant.kind!=="college")return NextResponse.json({error:"PAGE_UNAVAILABLE"},{status:404});
 const ip=process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY==="VERIFIED"
  ?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const result=await sendPublicEnquiryCode(tenant.collegeId,await request.json().catch(()=>null),ip);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof PublicEnquiryError)return NextResponse.json({
   error:error.code==="NOT_READY"?"RECRUITER_ENQUIRIES_UNAVAILABLE":
    error.code==="LIMIT"?"TOO_MANY_TRIES":"COULD_NOT_SEND_CODE",
  },{status:error.code==="NOT_READY"?503:error.code==="LIMIT"?429:400,
    headers:{"Cache-Control":"no-store"}});
  throw error;
 }
}
