import "server-only";
import {createHash,randomUUID} from "node:crypto";
import {eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementRecruiterInboundEmailEvents,placementRecruiterMessageMailState} from "@/db/schema";
import {inboundMailMessages} from "@/db/schema/inbound-mail";
import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
import {verifyRecruiterMailBridgeWithRotation,extractRecruiterEmailReply} from "./recruiter-message-email-model";

const inboundSchema=z.strictObject({
 from:z.email().max(320).transform(x=>x.trim().toLowerCase()),
 to:z.email().max(320).transform(x=>x.trim().toLowerCase()),
 text:z.string().max(200000).optional(),
 html:z.string().max(200000).optional(),
 subject:z.string().max(512).optional(),
 headerFrom:z.string().max(320).optional(),
 auth:z.string().max(2000).optional(),
 providerMessageId:z.string().trim().min(3).max(255).optional(),
 attachments:z.array(z.strictObject({filename:z.string().max(255).optional(),
  contentType:z.string().max(128).optional()})).max(40).optional(),
});
/** Trusted Cloudflare Email Routing/D1 -> private HMAC gateway -> service.
 * /api/internal/inbound-mail accepts all verified mail (OTHER plus REPLY).
 * /api/internal/placements/recruiter-message-inbound accepts recruiter replies
 * only, while both receipts are retained in inbound_mail_messages.
 * No public endpoint trusts a sender-controlled From or Authentication-Results
 * header. Worker failures must remain in D1 for retry, never be ACKed.
 */
export const VERIFIED_RECRUITER_INBOUND_ROUTES={
 providerWorker:"CLOUDFLARE_EMAIL_ROUTING_D1",
 generalIntake:"/api/internal/inbound-mail",
 recruiterIntake:"/api/internal/placements/recruiter-message-inbound",
 triage:"/admin/inbound-mail",
} as const;
export type RecruiterInboundOutcome=
 "POSTED"|"STORED"|"DUPLICATE"|"NO_THREAD"|"WRONG_SENDER"|
 "NOT_VERIFIED"|"EMPTY"|"ACCESS_ENDED"|"FAILED";
export type RecruiterEmailInboundResult={
 accepted:boolean;replayed:boolean;outcome?:RecruiterInboundOutcome;
 /** Storage is temporarily missing; a verified upstream worker must retry. */
 retryable?:boolean;
};
/** The trusted mail gateway signs the original payload after provider verification.
 * HTML-only mail is flattened to inert text, never interpreted as markup.
 */
function plainMailText(text:string|undefined,html:string|undefined){
 if(text?.trim())return text;
 if(!html)return "";
 const flattened=html
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"")
  .replace(/<br\s*\/?\s*>/gi,"\n")
  .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi,"\n")
  .replace(/<[^>]*>/g,"");
 return flattened
  .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/gi,entity=>{
   const table:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
   return table[entity.slice(1,-1).toLowerCase()]??entity;
  })
  .replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(entity,numeric:string)=>{
   const code=numeric[0]?.toLowerCase()==="x"?
    Number.parseInt(numeric.slice(1),16):Number.parseInt(numeric,10);
   return code>=0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)?
    String.fromCodePoint(code):entity;
  }).trim();
}
/** Upstream mail authentication must align with the account's From
 * domain. A PASS for an unrelated envelope sender or DKIM signing domain is
 * not authority to impersonate a recruiter. This header is trusted only
 * after the provider-verified worker and gateway HMAC boundary.
 */
function senderVerified(auth:string|undefined,fromAddress:string){
 const lower=auth?.toLowerCase()??"";
 const senderDomain=fromAddress.toLowerCase().split("@")[1]??"";
 if(!senderDomain||!/^([a-z0-9-]+\.)+[a-z]{2,63}$/.test(senderDomain)||
    /\bdmarc\s*=\s*fail\b/.test(lower))return false;
 // DMARC PASS is meaningful only for the same RFC5322 From domain.
 // A pass for an unrelated forwarded header must never authenticate a
 // message as the persisted recruiter account.
 const dmarc=lower.match(/\bdmarc\s*=\s*pass\b[^;\r\n]*\bheader\.from\s*=\s*([a-z0-9.-]+)/);
 if(dmarc?.[1]===senderDomain)return true;
 // If no DMARC PASS is available, only a domain explicitly paired with
 // its own passing SPF/DKIM result may be accepted. Unknown or unaligned
 // header values remain safely stored for manual triage.
 const aligned=(domain:string)=>
   /^([a-z0-9-]+\.)+[a-z]{2,63}$/.test(domain)&&
   (domain===senderDomain||senderDomain.endsWith("."+domain));
 const dkim=[...lower.matchAll(/\bdkim\s*=\s*pass\b[^;\n]*\bheader\.d\s*=\s*([a-z0-9.-]+)/g)];
 const spf=[...lower.matchAll(/\bspf\s*=\s*pass\b[^;\n]*\bsmtp\.mailfrom\s*=\s*([a-z0-9._%+-]+@)?([a-z0-9.-]+)/g)];
 return dkim.some(match=>aligned(match[1]??""))||
   spf.some(match=>aligned(match[2]??""));
}
/** Only a gateway that verifies the upstream mail provider may sign a payload.
 * A sender's From/Reply-To header alone never confers access. No email
 * addresses, message bodies, or token secrets are logged here.
 */
export async function acceptAuthenticatedRecruiterEmailReply(
 rawBody:string,signature:string,env:Record<string,string|undefined>=process.env,
):Promise<RecruiterEmailInboundResult>{
 // Enforce the same byte bound for non-HTTP callers before HMAC and JSON work.
 // The gateway currently caps HTTP requests at 20 kB. Once its verified
 // provider adapter allows larger payloads, this service can retain up to
 // 200,000 characters for restricted operator triage.
 if(Buffer.byteLength(rawBody,"utf8")>300_000)
  return {accepted:false,replayed:false,outcome:"FAILED"};
 const secret=env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET??"";
 if(env.RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED!=="true"||
    !verifyRecruiterMailBridgeWithRotation({
     body:rawBody,signature,currentSecret:secret,
     previousSecret:env.RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_SECRET,
     previousExpiresAt:env.RECRUITER_MESSAGE_INBOUND_HMAC_PREVIOUS_UNTIL,
    }))
  return {accepted:false,replayed:false};
 let json:unknown;
 try{json=JSON.parse(rawBody);}catch{return {accepted:false,replayed:false};}
 const parsed=inboundSchema.safeParse(json);
 if(!parsed.success)return {accepted:false,replayed:false};
 const input=parsed.data,domain=(env.RECRUITER_MESSAGE_REPLY_DOMAIN??"").toLowerCase();
 const fullText=plainMailText(input.text,input.html).slice(0,200000);
  if(!fullText)return {accepted:false,replayed:false};
 // Legacy stores up to 200k in the restricted inbox but only a 4k reply in
 // a conversation; slice by JS UTF-16 code units to match imported records.
 // An all-quoted reply is a valid authenticated receipt for human triage.
 // The extractor already enforces the maximum reply length and can return null.
 const replyBody=extractRecruiterEmailReply(fullText)??"";
 const match=/^r-([a-f0-9]{32})@(.+)$/.exec(input.to);
 const isReply=Boolean(match&&match[2]===domain);
  // This receiver is exclusively for the reply alias. General verified mail
  // is ingested through /api/internal/inbound-mail, never by guessing a thread.
  if(!isReply)return {accepted:false,replayed:false};
 const tokenHash=isReply&&match?createHash("sha256").update(match[1]).digest("hex"):null;
 // Inbox and reply posting are one atomic intake: no mail is acknowledged without
 // durable storage, including unknown mail, expired replies, and failed auth.
 const db=getDb();
 const [ready]=await db.execute<{ok:boolean}>(sql`
  select to_regclass('public.inbound_mail_messages') is not null as ok
 `).then(result=>result.rows);
 if(!ready?.ok)return {accepted:false,replayed:false,retryable:true};
 return db.transaction(async tx=>{
  // RFC Message-ID is not globally unique across redirected aliases. Scope
  // the idempotency key by the normalized envelope recipient, not by a
  // globally shared recruiter account or a raw token written to logs.
  const sourceMessageId=input.providerMessageId?.trim()
   ?"provider:"+createHash("sha256").update(input.to+"\u0000"+input.providerMessageId.trim()).digest("hex")
   :"signed-body:"+createHash("sha256").update(rawBody,"utf8").digest("hex");
  const [received]=await tx.insert(inboundMailMessages).values({
   id:randomUUID(),sourceMessageId,
   fromAddress:input.from,toAddress:input.to,
   subject:input.subject?.trim()||"(no subject)",
   bodyPlain:fullText,originalBodyPlain:fullText,
   bodyPreview:fullText.slice(0,1000),
   kind:isReply?"REPLY":"OTHER",
   receivedAt:new Date(),status:"NEW",
  }).onConflictDoNothing().returning({id:inboundMailMessages.id});
  if(!received)return {accepted:true,replayed:true,outcome:"DUPLICATE" as const};
  const auditResult=async(
    outcome:Exclude<RecruiterInboundOutcome,"DUPLICATE">,
    routed?:{threadId:string;postedMessageId:string;collegeId:string;recruiterUserId:string},
  )=>{
   const routedStatus=outcome;
   await tx.update(inboundMailMessages).set({
    kind:isReply?"REPLY":"OTHER",
    ...(routed?{
      threadId:routed.threadId,postedMessageId:routed.postedMessageId,
      collegeId:routed.collegeId,recruiterUserId:routed.recruiterUserId,
    }:{}),
    routingStatus:routedStatus,
    // Posted replies show the stripped body. Failed routes retain full text
    // for operator triage; originalBodyPlain always preserves the receipt.
    bodyPlain:routedStatus==="POSTED"?replyBody:fullText,
    bodyPreview:replyBody.slice(0,1000),
    routeAttemptCount:routedStatus==="STORED"?0:1,
    lastRouteAttemptAt:routedStatus==="STORED"?null:new Date(),
    lastRouteErrorCode:routedStatus==="POSTED"||routedStatus==="STORED"?null:routedStatus,
    nextRouteAttemptAt:["ACCESS_ENDED","FAILED"].includes(routedStatus)
     ?new Date(Date.now()+60*60*1000):null,
    status:routedStatus==="POSTED"?"RESOLVED":"NEW",
    version:1,
   }).where(eq(inboundMailMessages.id,received.id));
   return {accepted:true,replayed:false,outcome};
  };

  // rdev-/20-hex aliases from the old worker are intentionally accepted to
  // the private Inbox as unmatched, but cannot authorize a conversation post
  // without a new 32-hex token persisted to the signed mail-state table.
  if(!isReply)return auditResult("STORED");
  if(!replyBody)return auditResult("EMPTY");
  // Provider attachments are never opened or rendered as executable content.
  // Operators may see supplied filenames through the trusted worker's own
  // reporting, but no attachment bytes are stored in conversation messages.
  const declaredFrom=(/^.*<([^<>]+)>\s*$/.exec(input.headerFrom??"")?.[1]||
   input.headerFrom||input.from).trim().toLowerCase();
  if(declaredFrom!==input.from)
   return auditResult("WRONG_SENDER");
  if(!senderVerified(input.auth,input.from))
   return auditResult("NOT_VERIFIED");
  // Legacy +r-20hex and +rdev-20hex addresses are retained in Inbox for
  // triage; they cannot authenticate against vNext's 32hex persisted tokens.
  if(!tokenHash)return auditResult("NO_THREAD");
  const [replyReady]=await tx.execute<{ok:boolean}>(sql`
   select to_regclass('public.placement_recruiter_message_mail_state') is not null
     and to_regclass('public.placement_recruiter_inbound_email_events') is not null
     and exists(select 1 from information_schema.columns
       where table_name='placement_tpo_messages' and column_name='delivery_channel') as ok
  `).then(result=>result.rows);
  if(!replyReady?.ok)return auditResult("ACCESS_ENDED");
  // The indexed reply-token row lock serializes writes for this thread.
  // Never use a provider-global message id as a cross-tenant advisory lock.
  const [state]=await tx.select().from(placementRecruiterMessageMailState)
   .where(eq(placementRecruiterMessageMailState.replyTokenHash,tokenHash))
   .for("update").limit(1);
  if(!state||!state.replyTokenExpiresAt||state.replyTokenExpiresAt<=new Date())
   return auditResult("NO_THREAD");
  // DB-backed principal, thread owner, own company, active college/grant,
  // verified grant and unexpired DRIVES capability are all mandatory.
  const auth=await tx.execute<{college_id:string}>(sql`
   select t.college_id
   from placement_tpo_message_threads t
   join users u on u.id=t.recruiter_user_id and u.platform_status='ACTIVE'
   join placement_recruiter_profiles p on p.user_id=u.id and p.status='ACTIVE'
   join placement_recruiter_college_grants g on g.recruiter_user_id=u.id
    and g.status='ACTIVE' and g.verification_status='VERIFIED'
    and g.valid_until > now() and 'DRIVES'=any(g.capabilities)
   join placement_company_relationships rel on rel.id=g.company_relationship_id
    and rel.college_id=t.college_id and rel.company_id=p.company_id and rel.status='ACTIVE'
   join placement_companies company on company.id=p.company_id and company.status='ACTIVE'
   join colleges c on c.id=t.college_id and c.status='ACTIVE'
   where t.id=${state.threadId}::uuid and t.recruiter_user_id=${state.recruiterUserId}::uuid
     and lower(u.email)=${input.from} and
     (t.job_id is null or exists(select 1 from placement_jobs j where j.id=t.job_id
        and j.college_id=t.college_id and j.company_relationship_id=rel.id))
   limit 1
  `);
  if(!auth.rows[0])return auditResult("ACCESS_ENDED");
  const msgHash=createHash("sha256").update(state.threadId+"\u0000"+sourceMessageId).digest("hex");
  const [duplicate]=await tx.select({
    threadId:placementRecruiterInboundEmailEvents.threadId,
    messageId:placementRecruiterInboundEmailEvents.messageId,
  })
    .from(placementRecruiterInboundEmailEvents)
    .where(eq(placementRecruiterInboundEmailEvents.messageIdHash,msgHash)).limit(1);
  if(duplicate){
   // The event key includes the live thread ID. A foreign row is corrupt or
   // adversarial state, never authority to link someone else's conversation.
   if(duplicate.threadId!==state.threadId)return auditResult("FAILED");
   // The conversation event was already committed, but this provider alias
   // generated a distinct inbox receipt. Resolve it instead of leaving a
   // misleading unrouted NEW message in the operator triage queue.
   await tx.update(inboundMailMessages).set({
    kind:"REPLY",routingStatus:"POSTED",status:"RESOLVED",
    bodyPlain:replyBody,bodyPreview:replyBody.slice(0,1000),
    // The dedup ledger UUID is not the conversation message UUID.
    threadId:duplicate.threadId,postedMessageId:duplicate.messageId,
    recruiterUserId:state.recruiterUserId,collegeId:auth.rows[0].college_id,
    routeAttemptCount:1,lastRouteAttemptAt:new Date(),
    lastRouteErrorCode:null,version:1,
   }).where(eq(inboundMailMessages.id,received.id));
   return {accepted:true,replayed:true,outcome:"DUPLICATE" as const};
  }
  const inserted=await tx.execute<{id:string}>(sql`
    insert into placement_tpo_messages(thread_id,sender_type,sender_user_id,body,delivery_channel)
    values(${state.threadId}::uuid,'RECRUITER',${state.recruiterUserId}::uuid,${replyBody},'EMAIL')
    returning id
  `);
  const id=inserted.rows[0]?.id;
  if(!id)throw new Error("RECRUITER_EMAIL_REPLY_NOT_SAVED");
  await tx.insert(placementRecruiterInboundEmailEvents).values({
   threadId:state.threadId,messageIdHash:msgHash,messageId:id,
  });
  await tx.execute(sql`update placement_tpo_message_threads set last_message_at=now()
    where id=${state.threadId}::uuid`);
  await notifyTpoOfRecruiterMessage(tx,{
   collegeId:auth.rows[0].college_id,threadId:state.threadId,messageId:id,
   senderUserId:state.recruiterUserId,at:new Date(),
  });
  // Successfully routed mail needs no manual triage; failed/unknown mail
  // remains NEW in the Super Admin Inbox for operator follow-up.
  return auditResult("POSTED",{
    threadId:state.threadId,postedMessageId:id,
    collegeId:auth.rows[0].college_id,recruiterUserId:state.recruiterUserId,
  });
 });
}
