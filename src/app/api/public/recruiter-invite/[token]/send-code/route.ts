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
 let deliveryAttempted=false;
 let deliverySucceeded=false;
 let confirmedMailbox:string|null=null;
 try{
  await requestRecruiterInviteOtp(token,async(email,code)=>{
   // Track the outcome without echoing the recipient or OTP. Provider
   // rejection is operational unavailability, not an invalid invitation.
   deliveryAttempted=true;
   // Expose only a masked confirmation. The mailbox is selected from the
   // persisted invite, never from untrusted public request parameters.
   const [local,domain]=email.split("@");
   if(local&&domain)confirmedMailbox=local.slice(0,1)+"***@"+domain;
   deliverySucceeded=await deliverPublicRecruiterJoinCode(email,code);
   return deliverySucceeded;
  });
  // The code is delivered only to the persisted college-company mailbox.
  // Never echo an arbitrary email supplied by the unauthenticated caller.
  return NextResponse.json({status:"CODE_SENT",sent:true,
   ...(confirmedMailbox?{email:confirmedMailbox}:{}),
  },{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const code=error instanceof Error?error.message:"";
  if((deliveryAttempted&&!deliverySucceeded)||code==="RECRUITER_OTP_NOT_REGISTERED"||code==="RECRUITER_OTP_STORE_FAILED")
    return NextResponse.json({error:"CODE_NOT_SENT"},{status:503,headers:{"Cache-Control":"no-store"}});
  if(code==="TOO_MANY_CODES")
   return NextResponse.json({error:"TOO_MANY_CODES",message:"Too many codes requested. Please try again later."},
    {status:429,headers:{"Cache-Control":"no-store","Retry-After":"3600"}});
  if(code==="EMAIL_REQUIRED"||code==="COMPANY_EMAIL_REQUIRED")
   return NextResponse.json({error:code,message:code==="EMAIL_REQUIRED"?
    "An email address is required for this invitation.":
    "A company email address is required for this invitation."},
    {status:422,headers:{"Cache-Control":"no-store"}});
  // Expired/used/invalid bearer links remain indistinguishable to avoid
  // disclosing invitation lifecycle to unauthenticated callers.
  return NextResponse.json({error:"INVITE_INVALID"},{status:404,headers:{"Cache-Control":"no-store"}});
 }
}
