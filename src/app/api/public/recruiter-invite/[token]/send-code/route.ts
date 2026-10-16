import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {requestRecruiterInviteOtp} from "@/modules/placements/recruiter-invite-otp-service";
import {deliverPublicRecruiterJoinCode} from "@/modules/messaging/public-join-code-delivery";
import {isRecruiterInviteTokenShape} from "@/modules/placements/tpo-recruiter-invite-policy";
import {recruiterInviteAcceptReady} from "@/modules/placements/recruiter-invite-otp-accept-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {token}=await params;
 if(!isRecruiterInviteTokenShape(token))return NextResponse.json({error:"INVITE_INVALID"},{status:404});
 if(!recruiterInviteAcceptReady({db09:process.env.DB09_TPO_API_READY,
  otp:process.env.TPO_RECRUITER_OTP_READY,delivery:process.env.TPO_RECRUITER_OTP_DELIVERY_READY}))
   return NextResponse.json({error:"RECRUITER_INVITE_NOT_READY"},{status:503});
 try{
  await requestRecruiterInviteOtp(token,deliverPublicRecruiterJoinCode);
  return NextResponse.json({sent:true},{headers:{"Cache-Control":"no-store"}});
 }catch{
  // Do not distinguish invalid, used, throttled or expired invitations.
  return NextResponse.json({error:"INVITE_INVALID"},{status:404,headers:{"Cache-Control":"no-store"}});
 }
}
