import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/request-body";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import {
 recruiterInviteAcceptReady,recruiterInviteAcceptanceBodySchema,
} from "@/modules/placements/recruiter-invite-otp-accept-model";
import {acceptPublicTpoRecruiterInviteOtp} from "@/modules/placements/public-recruiter-invite-accept-service";
import { route } from "@/security/route";

import { env } from "@/config/env";
import { CACHE } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":CACHE.PRIVATE,"Referrer-Policy":"no-referrer"} as const;
type RouteContext={params:Promise<{token:string}>};
async function handlePOST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 if(!recruiterInviteAcceptReady({
   db09:env.DB09_TPO_API_READY,
   otp:env.TPO_RECRUITER_OTP_READY,
   delivery:env.TPO_RECRUITER_OTP_DELIVERY_READY,
 }))return NextResponse.json({error:"RECRUITER_INVITE_NOT_READY"},{status:503,headers:noStore});
 if(new URL(request.url).search)
  return NextResponse.json({error:"INVITE_INVALID"},{status:400,headers:noStore});
 const body=await readBoundedJsonBody(request);
 if(body.kind==="TOO_LARGE")return NextResponse.json({error:"INVITE_INVALID"},
  {status:413,headers:noStore});
 const input=recruiterInviteAcceptanceBodySchema.safeParse(body.kind==="OK"?body.value:null);
 if(!input.success)return NextResponse.json({error:"INVITE_INVALID"},{status:404,headers:noStore});
 try{
  const {token}=await params;
  const accepted=await acceptPublicTpoRecruiterInviteOtp(token,input.data.code,input.data);
  return NextResponse.json(accepted,{headers:noStore});
 }catch(error){
  return tpoRecruiterInviteApiErrorResponse(error);
 }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
