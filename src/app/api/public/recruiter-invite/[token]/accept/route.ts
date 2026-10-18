import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import {
 recruiterInviteAcceptReady,recruiterInviteAcceptanceBodySchema,
} from "@/modules/placements/recruiter-invite-otp-accept-model";
import {acceptPublicTpoRecruiterInviteOtp} from "@/modules/placements/public-recruiter-invite-accept-service";

export const runtime="nodejs";
type RouteContext={params:Promise<{token:string}>};
export async function POST(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 if(!recruiterInviteAcceptReady({
   db09:process.env.DB09_TPO_API_READY,
   otp:process.env.TPO_RECRUITER_OTP_READY,
   delivery:process.env.TPO_RECRUITER_OTP_DELIVERY_READY,
 }))return NextResponse.json({error:"RECRUITER_INVITE_NOT_READY"},{status:503});
 const body=await readBoundedJsonBody(request);
 if(body.kind==="TOO_LARGE")return NextResponse.json({error:"INVITE_INVALID"},
  {status:413,headers:{"Cache-Control":"no-store"}});
 const input=recruiterInviteAcceptanceBodySchema.safeParse(body.kind==="OK"?body.value:null);
 if(!input.success)return NextResponse.json({error:"INVITE_INVALID"},{status:404});
 try{
  const {token}=await params;
  const accepted=await acceptPublicTpoRecruiterInviteOtp(token,input.data.code,input.data);
  return NextResponse.json(accepted,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  return tpoRecruiterInviteApiErrorResponse(error);
 }
}
