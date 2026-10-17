import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {acceptAuthenticatedRecruiterEmailReply} from "@/modules/placements/recruiter-message-email-inbound-service";
export const runtime="nodejs";
/** A trusted inbound-mail gateway must verify its provider webhook before
 * forwarding a same-origin request signed with RECRUITER_MESSAGE_INBOUND_HMAC_SECRET.
 * A bare spoofed From header or a browser POST never authenticates a recruiter.
 */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 const raw=await request.text();
 if(Buffer.byteLength(raw,"utf8")>20_000)
  return NextResponse.json({error:"INVALID_BODY"},{status:413});
 try{
  const result=await acceptAuthenticatedRecruiterEmailReply(
   raw,request.headers.get("x-recruiter-mail-signature")??"");
  if(!result.accepted)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  return NextResponse.json({accepted:true,replayed:result.replayed},
   {headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"SERVICE_UNAVAILABLE"},{status:503});
 }
}
