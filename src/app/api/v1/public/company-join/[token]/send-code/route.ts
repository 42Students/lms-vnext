import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/request-body";
import {requestPublicJoinCode,PublicJoinCodeError} from "@/modules/placements/public-join/send-code-service";
import {deliverPublicRecruiterJoinCode} from "@/modules/messaging/public-join-code-delivery";
import { route } from "@/security/route";
import { featureReady } from "@/config/features";
import { CACHE, noStoreJson } from "@/security/responses";
export const runtime="nodejs";
/** Legacy token-in-path adapter; same verified-IP throttle and OTP delivery. */
async function handlePOST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body=await readBoundedJsonBody(request);
 if(body.kind!=="OK")return NextResponse.json({error:body.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"COULD_NOT_SEND_CODE"},
  {status:body.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":CACHE.NONE}});
 const payload=body.value;
 const {token}=await params;
 const trusted=featureReady("publicJoinTrustedProxy");
 const ip=trusted?request.headers.get("x-public-verified-client-ip"):null;
 try{
  const email=typeof payload==="object"&&payload!==null&&"email" in payload?payload.email:undefined;
  const result=await requestPublicJoinCode("COMPANY",{token,email},ip,deliverPublicRecruiterJoinCode);
  return noStoreJson({sent:true,companyName:result.companyName});
 }catch(error){
  const code=error instanceof PublicJoinCodeError?error.code:"SERVICE_UNAVAILABLE";
  const status=code==="NETWORK_GUARD_NOT_READY"||code==="EMAIL_MX_UNAVAILABLE"?503:code==="RATE_LIMITED"?429:400;
  return NextResponse.json({error:code==="RATE_LIMITED"?"TOO_MANY_CODES":code==="NETWORK_GUARD_NOT_READY"?"SERVICE_NOT_READY":code},
   {status,headers:{"Cache-Control":CACHE.NONE}});
 }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
