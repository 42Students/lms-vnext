import { NextResponse } from "next/server";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { isSameOriginRequest } from "@/auth/origin";
import { submitPublicRecruitEnquiry } from "@/modules/placements/public-enquiry/recruit-service";
import { PublicEnquiryError } from "@/modules/placements/public-enquiry/send-service";
import {readPublicRecruitEnquiryBody} from "@/modules/placements/public-enquiry/body-model";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 let tenant:Awaited<ReturnType<typeof resolveRequestTenant>>;
 try {tenant=await resolveRequestTenant(request.headers.get("host"));}
 catch {return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
  {status:503,headers:{"Cache-Control":"no-store"}});}
 if(tenant.kind!=="college")return NextResponse.json({error:"PAGE_UNAVAILABLE"},{status:404});
 const body=await readPublicRecruitEnquiryBody(request);
 if(body.kind!=="OK")return NextResponse.json(
  body.kind==="TOO_LARGE"?{error:"REQUEST_TOO_LARGE"}:
   request.headers.get("content-length")==="0"||!request.headers.get("content-type")
    ?{error:"BODY_REQUIRED",message:"Details are required"}
    :{error:"INVALID_BODY",message:"Enter valid enquiry details"},
  {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!body.value||typeof body.value!=="object"||Array.isArray(body.value))
  return NextResponse.json({error:"BODY_REQUIRED",message:"Details are required"},{status:400,headers:{"Cache-Control":"no-store"}});
 const input=body.value as Record<string,unknown>;
 if(typeof input.code!=="string"||!input.code.trim())
  return NextResponse.json({error:"CODE_REQUIRED",message:"Enter the code"},{status:400,headers:{"Cache-Control":"no-store"}});
 if(!/^[0-9]{6}$/.test(input.code))
  return NextResponse.json({error:"WRONG_CODE",message:"Enter the 6-digit code we sent to your work email."},{status:400,headers:{"Cache-Control":"no-store"}});
 const ip=process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY==="VERIFIED"
  ?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const result=await submitPublicRecruitEnquiry(tenant.collegeId,body.value,ip);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(error instanceof PublicEnquiryError)return NextResponse.json({
   error:error.code==="NOT_READY"?"RECRUITER_ENQUIRIES_UNAVAILABLE":
    error.code==="LIMIT"?"TOO_MANY_TRIES":error.code==="INVALID"?"INVALID_CODE_OR_EXPIRED":"COULD_NOT_SEND_ENQUIRY",
   ...(error.code==="INVALID"?{message:"The code is incorrect, expired or locked. Request a new code if needed."}:{}) ,
  },{status:error.code==="NOT_READY"?503:error.code==="LIMIT"?429:400,
   headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},
   {status:503,headers:{"Cache-Control":"no-store"}});
 }
}
