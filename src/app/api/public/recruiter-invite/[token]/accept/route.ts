import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
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
 const body=await request.json().catch(()=>null);
 const input=recruiterInviteAcceptanceBodySchema.safeParse(body);
 if(!input.success)return NextResponse.json({error:"INVITE_INVALID"},{status:404});
 try{
  const {token}=await params;
  const accepted=await acceptPublicTpoRecruiterInviteOtp(token,input.data.code);
  return NextResponse.json(accepted,{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  return tpoRecruiterInviteApiErrorResponse(error);
 }
}
