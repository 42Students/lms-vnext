import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {requestPublicJoinCode,PublicJoinCodeError} from "@/modules/placements/public-join/send-code-service";
import {deliverPublicRecruiterJoinCode} from "@/modules/messaging/public-join-code-delivery";
export const runtime="nodejs";
/** Legacy token-in-path adapter; same verified-IP throttle and OTP delivery. */
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=await readBoundedJsonBody(request);
 if(body.kind!=="OK")return NextResponse.json({error:body.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"COULD_NOT_SEND_CODE"},
  {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":"no-store"}});
 const payload=body.value;
 const {token}=await params;
 const trusted=process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY==="VERIFIED";
 const ip=trusted?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const email=typeof payload==="object"&&payload!==null&&"email" in payload?payload.email:undefined;
  const result=await requestPublicJoinCode("COMPANY",{token,email},ip,deliverPublicRecruiterJoinCode);
  return NextResponse.json({sent:true,companyName:result.companyName},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const code=error instanceof PublicJoinCodeError?error.code:"SERVICE_UNAVAILABLE";
  const status=code==="NETWORK_GUARD_NOT_READY"||code==="EMAIL_MX_UNAVAILABLE"?503:code==="RATE_LIMITED"?429:400;
  return NextResponse.json({error:code==="RATE_LIMITED"?"TOO_MANY_CODES":code==="NETWORK_GUARD_NOT_READY"?"SERVICE_NOT_READY":code},
   {status,headers:{"Cache-Control":"no-store"}});
 }
}
