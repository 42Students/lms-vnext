import "server-only";
import {createHash} from "node:crypto";
import {eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementRecruiterInboundEmailEvents,placementRecruiterMessageMailState} from "@/db/schema";
import {notifyTpoOfRecruiterMessage} from "./recruiter-message-tpo-notification-service";
import {verifyRecruiterMailBridgeSignature,extractRecruiterEmailReply} from "./recruiter-message-email-model";

const inboundSchema=z.strictObject({
 from:z.email().max(320).transform(x=>x.trim().toLowerCase()),
 to:z.email().max(320).transform(x=>x.trim().toLowerCase()),
 text:z.string().min(1).max(20000),
 providerMessageId:z.string().trim().min(8).max(255),
});
export type RecruiterEmailInboundResult={accepted:boolean;replayed:boolean};
/** Only a gateway that verifies the upstream mail provider may sign a payload.
 * A sender's From/Reply-To header alone never confers access. No email
 * addresses, message bodies, or token secrets are logged here.
 */
export async function acceptAuthenticatedRecruiterEmailReply(
 rawBody:string,signature:string,env:Record<string,string|undefined>=process.env,
):Promise<RecruiterEmailInboundResult>{
 // Enforce the same byte bound for non-HTTP callers before HMAC and JSON work.
 if(Buffer.byteLength(rawBody,"utf8")>20_000)
  return {accepted:false,replayed:false};
 const secret=env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET??"";
 if(env.RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED!=="true"||
    !verifyRecruiterMailBridgeSignature(secret,rawBody,signature))
  return {accepted:false,replayed:false};
 let json:unknown;
 try{json=JSON.parse(rawBody);}catch{return {accepted:false,replayed:false};}
 const parsed=inboundSchema.safeParse(json);
 if(!parsed.success)return {accepted:false,replayed:false};
 const input=parsed.data,domain=(env.RECRUITER_MESSAGE_REPLY_DOMAIN??"").toLowerCase();
 const replyBody=extractRecruiterEmailReply(input.text);
 if(!replyBody)return {accepted:false,replayed:false};
 const match=/^r-([a-f0-9]{32})@(.+)$/.exec(input.to);
 if(!match||match[2]!==domain)return {accepted:false,replayed:false};
 const tokenHash=createHash("sha256").update(match[1]).digest("hex");
 // Idempotency belongs to the authorized thread, not a provider-global identifier.
 // The same upstream message id in a different college must not claim replay.

 const db=getDb();
 const [ready]=await db.execute<{ok:boolean}>(sql`
  select to_regclass('public.placement_recruiter_message_mail_state') is not null
    and to_regclass('public.placement_recruiter_inbound_email_events') is not null
    and exists(select 1 from information_schema.columns
      where table_name='placement_tpo_messages' and column_name='delivery_channel') as ok
 `).then(result=>result.rows);
 if(!ready?.ok)return {accepted:false,replayed:false};
 return db.transaction(async tx=>{
  // The indexed reply-token row lock serializes writes for this thread.
  // Never use a provider-global message id as a cross-tenant advisory lock.
  const [state]=await tx.select().from(placementRecruiterMessageMailState)
   .where(eq(placementRecruiterMessageMailState.replyTokenHash,tokenHash))
   .for("update").limit(1);
  if(!state||!state.replyTokenExpiresAt||state.replyTokenExpiresAt<=new Date())
   return {accepted:false,replayed:false};
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
  if(!auth.rows[0])return {accepted:false,replayed:false};
  const msgHash=createHash("sha256").update(state.threadId+"\u0000"+input.providerMessageId).digest("hex");
  const [duplicate]=await tx.select({id:placementRecruiterInboundEmailEvents.id,
    threadId:placementRecruiterInboundEmailEvents.threadId})
    .from(placementRecruiterInboundEmailEvents)
    .where(eq(placementRecruiterInboundEmailEvents.messageIdHash,msgHash)).limit(1);
  if(duplicate)return {accepted:duplicate.threadId===state.threadId,replayed:true};
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
  return {accepted:true,replayed:false};
 });
}
