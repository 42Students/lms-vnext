import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";
import {eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {inboundMailMessages} from "@/db/schema/inbound-mail";
import {inboundMailRecipientKind} from "@/db/schema/inbound-mail";
import {acceptAuthenticatedRecruiterEmailReply} from "@/modules/placements/recruiter-message-email-inbound-service";

/** The Cloudflare worker must validate upstream provider provenance before
 * signing the exact UTF-8 payload. Never trust unsigned From/auth headers. */
const payload=z.strictObject({
 from:z.email().max(320),
 to:z.email().max(320),
 providerMessageId:z.string().trim().min(1).max(255),
 subject:z.string().max(512).optional(),
 text:z.string().max(20000).optional(),
 html:z.string().max(20000).optional(),
 headerFrom:z.string().max(320).optional(),
 auth:z.string().max(2000).optional(),
});
export class VerifiedInboundMailError extends Error{
 constructor(readonly code:"NOT_CONFIGURED"|"INVALID_SIGNATURE"|"INVALID_PAYLOAD"|"NOT_READY"){
  super(code);this.name="VerifiedInboundMailError";
 }
}
function requireWorkerProof(raw:string,signature:string,secret:string){
 if(Buffer.byteLength(secret,"utf8")<32)throw new VerifiedInboundMailError("NOT_CONFIGURED");
 if(!/^[a-f0-9]{64}$/i.test(signature))
  throw new VerifiedInboundMailError("INVALID_SIGNATURE");
 const expected=createHmac("sha256",secret).update(raw,"utf8").digest();
 if(!timingSafeEqual(expected,Buffer.from(signature,"hex")))
  throw new VerifiedInboundMailError("INVALID_SIGNATURE");
}
function safelyFlattenHtml(html:string){
 return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"")
  .replace(/<br\s*\/?\s*>/gi,"\n")
  .replace(/<[^>]*>/g,"")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"")
  .slice(0,20000);
}
export async function ingestVerifiedInboundMail(raw:string,signature:string,
 env:Record<string,string|undefined>=process.env){
 if(Buffer.byteLength(raw,"utf8")>20000)throw new VerifiedInboundMailError("INVALID_PAYLOAD");
 if(env.INBOUND_MAIL_INGESTION_ENABLED!=="true")
  throw new VerifiedInboundMailError("NOT_CONFIGURED");
 requireWorkerProof(raw,signature,env.INBOUND_MAIL_HMAC_SECRET??"");
 let decoded:unknown;
 try{decoded=JSON.parse(raw);}catch{throw new VerifiedInboundMailError("INVALID_PAYLOAD");}
 const validated=payload.safeParse(decoded);
 if(!validated.success)throw new VerifiedInboundMailError("INVALID_PAYLOAD");
 const input=validated.data;
 const [table]=await getDb().execute<{ready:boolean}>(sql`
  select to_regclass('public.inbound_mail_messages') is not null as ready
 `).then(r=>r.rows);
 if(!table?.ready)throw new VerifiedInboundMailError("NOT_READY");
 // Route signed recruiter replies through their separate persisted authorizer.
 // That service writes the same shared Inbox even for rejected/expired replies.
 if(env.RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED==="true"){
  const recruiterSecret=env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET??"";
  if(Buffer.byteLength(recruiterSecret,"utf8")>=32){
   try{
    const recruiterSig=createHmac("sha256",recruiterSecret)
     .update(raw,"utf8").digest("hex");
    const result=await acceptAuthenticatedRecruiterEmailReply(raw,recruiterSig,env);
    if(result.accepted)return {accepted:true as const,replayed:result.replayed,
     routedAs:result.outcome??"STORED"};
   }catch{
    // The general inbox is the durable recovery path if reply routing fails.
   }
  }
 }
 const kind=inboundMailRecipientKind(input.to,env.RECRUITER_MESSAGE_REPLY_DOMAIN??"");
 const text=(input.text?.trim()||safelyFlattenHtml(input.html??"")).slice(0,20000);
 const [created]=await getDb().insert(inboundMailMessages).values({
  sourceMessageId:input.providerMessageId,
  fromAddress:input.from.trim().toLowerCase(),
  toAddress:input.to.trim().toLowerCase(),
  subject:input.subject?.trim()||"(no subject)",
  bodyPlain:text,originalBodyPlain:text,bodyPreview:text.slice(0,1000),
  receivedAt:new Date(),
  kind,
  routingStatus:kind==="REPLY"?"ACCESS_ENDED":"STORED",
  lastRouteErrorCode:kind==="REPLY"?"ACCESS_ENDED":null,
  status:"NEW",
 }).onConflictDoNothing().returning({id:inboundMailMessages.id});
 if(created)return {accepted:true as const,replayed:false,routedAs:kind==="REPLY"?"ACCESS_ENDED":"STORED"};
 const [existing]=await getDb().select({id:inboundMailMessages.id})
  .from(inboundMailMessages).where(eq(inboundMailMessages.sourceMessageId,input.providerMessageId)).limit(1);
 if(!existing)throw new VerifiedInboundMailError("NOT_READY");
 return {accepted:true as const,replayed:true,routedAs:"DUPLICATE"};
}
