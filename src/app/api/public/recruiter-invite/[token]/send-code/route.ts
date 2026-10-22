import {NextResponse} from "next/server";
import {z} from "zod";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
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
 if(!recruiterInviteAcceptReady({db09:process.env["DB09_TPO_API_READY"],
  otp:process.env["TPO_RECRUITER_OTP_READY"],delivery:process.env["TPO_RECRUITER_OTP_DELIVERY_READY"]}))
   return NextResponse.json({error:"RECRUITER_INVITE_NOT_READY"},{status:503});
 let email:string|undefined;
 if(request.body!==null){
  const body=await readBoundedJsonBody(request);
  if(body.kind==="TOO_LARGE")
   return NextResponse.json({error:"INVALID_REQUEST"},{status:413,headers:{"Cache-Control":"no-store"}});
  const parsed=z.strictObject({email:z.email().max(150)}).safeParse(body.kind==="OK"?body.value:null);
  if(!parsed.success)
   return NextResponse.json({error:"COMPANY_EMAIL_REQUIRED"},{status:422,headers:{"Cache-Control":"no-store"}});
  email=parsed.data.email;
 }
 let deliveryAttempted=false;
 let deliverySucceeded=false;
 let confirmedMailbox:string|null=null;
 try{
  await requestRecruiterInviteOtp(token,async(recipient,code)=>{
   // Track the outcome without echoing the recipient or OTP. Provider
   // rejection is operational unavailability, not an invalid invitation.
   deliveryAttempted=true;
   // Expose only a masked confirmation. The mailbox is selected from the
   // persisted invite, never from untrusted public request parameters.
   const [local,domain]=recipient.split("@");
   if(local&&domain)confirmedMailbox=local.slice(0,1)+"***@"+domain;
   deliverySucceeded=await deliverPublicRecruiterJoinCode(recipient,code);
   return deliverySucceeded;
  },email);
  // The code is delivered only to the invitation's existing mailbox or a
  // newly persisted, exact-company-domain mailbox. Never echo the address.
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
