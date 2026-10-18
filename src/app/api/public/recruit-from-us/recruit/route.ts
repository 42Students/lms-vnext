import { NextResponse } from "next/server";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { isSameOriginRequest } from "@/auth/origin";
import { submitPublicRecruitEnquiry } from "@/modules/placements/public-enquiry/recruit-service";
import { PublicEnquiryError } from "@/modules/placements/public-enquiry/send-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 let tenant:Awaited<ReturnType<typeof resolveRequestTenant>>;
 try {tenant=await resolveRequestTenant(request.headers.get("host"));}
 catch {return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
  {status:503,headers:{"Cache-Control":"no-store"}});}
 if(tenant.kind!=="college")return NextResponse.json({error:"PAGE_UNAVAILABLE"},{status:404});
 const ip=process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY==="VERIFIED"
  ?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const result=await submitPublicRecruitEnquiry(tenant.collegeId,await request.json().catch(()=>null),ip);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof PublicEnquiryError)return NextResponse.json({
   error:error.code==="NOT_READY"?"RECRUITER_ENQUIRIES_UNAVAILABLE":
    error.code==="LIMIT"?"TOO_MANY_TRIES":"COULD_NOT_SEND_ENQUIRY",
  },{status:error.code==="NOT_READY"?503:error.code==="LIMIT"?429:400,
   headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
