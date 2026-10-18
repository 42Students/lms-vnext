import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {acceptAuthenticatedRecruiterEmailReply} from "@/modules/placements/recruiter-message-email-inbound-service";
import {readBoundedRecruiterInboundBody} from "@/modules/placements/recruiter-mail-body-model";
export const runtime="nodejs";
/** A trusted inbound-mail gateway must verify its provider webhook before
 * forwarding a same-origin request signed with RECRUITER_MESSAGE_INBOUND_HMAC_SECRET.
 * A bare spoofed From header or a browser POST never authenticates a recruiter.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 try{
  const raw=await readBoundedRecruiterInboundBody(request);
  if(raw.kind==="TOO_LARGE")
   return NextResponse.json({error:"INVALID_BODY"},{status:413});
  if(raw.kind==="INVALID_UTF8")
   return NextResponse.json({error:"INVALID_BODY"},{status:400});
  const result=await acceptAuthenticatedRecruiterEmailReply(
   raw.body,request.headers.get("x-recruiter-mail-signature")??"");
  if(!result.accepted)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  return NextResponse.json({accepted:true,replayed:result.replayed},
   {headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503});
 }
}
