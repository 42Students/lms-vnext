import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {acceptAuthenticatedRecruiterEmailReply} from "@/modules/placements/recruiter-message-email-inbound-service";
import {readBoundedRecruiterInboundBody} from "@/modules/placements/recruiter-mail-body-model";

export const runtime="nodejs";

/**
 * Cloudflare Email Routing worker integration contract (server-to-server only):
 * - The worker verifies provider provenance and retains a recoverable intake in D1.
 * - A trusted, separately deployed HTTPS gateway verifies the worker before signing
 *   the original UTF-8 payload with RECRUITER_MESSAGE_INBOUND_HMAC_SECRET.
 * - The gateway forwards to this private route with a trusted same-origin Origin,
 *   matching Host/proto from the deployment proxy, and
 *   x-recruiter-mail-signature. Never allow a caller to pick forwarded host/proto.
 * - On 200: ACK; replayed=true is already delivered. On 400/413: quarantine the
 *   malformed payload without blind retries; on 403: security reject; on 503:
 *   retain in the upstream 30-day inbox and retry with capped backoff.
 * - Rotate gateway/receiver HMAC secrets together using coordinated deployment,
 *   and watch bounded status-code counts; never log sender, subject, body or secret.
 * Public /api/v1/public/inbound-email is NOT exposed by this app; an external
 * adapter must rewrite it after verifying the provider signature.
 */
const noStore={"Cache-Control":"no-store"};
function reply(body:{error:string}|{accepted:true;replayed:boolean},status=200){
 return NextResponse.json(body,{status,headers:noStore});
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request)){
  console.warn("[recruiter-mail-inbound] origin rejected");
  return reply({error:"FORBIDDEN"},403);
 }
 try{
  const raw=await readBoundedRecruiterInboundBody(request);
  if(raw.kind==="TOO_LARGE"){
   console.warn("[recruiter-mail-inbound] payload too large");
   return reply({error:"INVALID_BODY"},413);
  }
  if(raw.kind==="INVALID_UTF8"){
   console.warn("[recruiter-mail-inbound] invalid utf8");
   return reply({error:"INVALID_BODY"},400);
  }
  const result=await acceptAuthenticatedRecruiterEmailReply(
   raw.body,request.headers.get("x-recruiter-mail-signature")??"");
  if(!result.accepted){
   // A validated gateway request with an unready DB is retryable; a rejected
   // HMAC is not. Upstream must retain the message on 503, not discard it.
   if(result.retryable)return reply({error:"SERVICE_UNAVAILABLE"},503);
   console.warn("[recruiter-mail-inbound] unaccepted");
   return reply({error:"FORBIDDEN"},403);
  }
  // Outcomes are an internal, fixed vocabulary (POSTED, STORED, DUPLICATE,
  // NO_THREAD, WRONG_SENDER, NOT_VERIFIED, EMPTY, ACCESS_ENDED).
  // Keep it out of the HTTP response, but make it observable to operators.
  console.info("[recruiter-mail-inbound] outcome",result.outcome??"STORED",
   result.replayed?"replayed":"new");
  return reply({accepted:true,replayed:result.replayed});
 }catch{
  console.error("[recruiter-mail-inbound] intake unavailable");
  return reply({error:"SERVICE_UNAVAILABLE"},503);
 }
}
