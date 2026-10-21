import "server-only";
import {createHash} from "node:crypto";
import {and,desc,eq,isNull,lt,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementRecruiterMessageMailState,placementTpoMessages,placementTpoLeads,
  placementCompanyRelationships,colleges} from "@/db/schema";
import {isRecruiterUnreadReminderDue,makeRecruiterReplyAddress,recruiterReplyTokenForThread} from "./recruiter-message-email-model";
import {sendRecruiterMessageDigest,recruiterDigestReadiness} from "./recruiter-message-email-provider";
import {readZeptoMailConfig,resolveZeptoMailTemplateId,sendZeptoMailTemplate} from "@/modules/notifications/zeptomail-email";
import {isCampaignTemplateKey} from "@/modules/messaging/template-boundary-model";

type Candidate={
 thread_id:string;recruiter_user_id:string;recipient_email:string;
 recipient_name:string;college_id:string;
 college_name:string;company_name:string;
 first_unread_at:Date;last_unread_at:Date;
};
type MailSummary={examined:number;sent:number;enabled:boolean;
 failed?:number;readinessReason?:string;operatorAlert?:string};

/** The queue worker must be invoked by a separately authenticated scheduler.
 * No page GET sends mail. Before migration/provider enablement it is an inert no-op.
 */
export async function dispatchRecruiterUnreadMessageDigests(
 env:Record<string,string|undefined>=process.env,
 now:Date=new Date(),
):Promise<MailSummary>{
 const readiness=recruiterDigestReadiness(env);
 if(!readiness.configured)return {examined:0,sent:0,enabled:false,
  readinessReason:readiness.reason,operatorAlert:"Recruiter email bridge is not ready: "+readiness.reason};
 const replyDomain=(env.RECRUITER_MESSAGE_REPLY_DOMAIN??"").trim().toLowerCase();
 const replySecret=env.RECRUITER_MESSAGE_REPLY_TOKEN_SECRET??"";
 const inboundSecret=env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET??"";
 const templateKey=(env.RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY??"").trim();
 const mailConfig=readZeptoMailConfig(env);
 if(Buffer.byteLength(replySecret,"utf8")<32||
    Buffer.byteLength(inboundSecret,"utf8")<32||
    !isCampaignTemplateKey(templateKey)||templateKey===mailConfig.otpTemplateKey||!mailConfig.token.trim())
  return {examined:0,sent:0,enabled:false,readinessReason:"SECRETS_OR_TEMPLATE_INVALID",
   operatorAlert:"Recruiter email bridge requires verified secrets and template"};
 if(!makeRecruiterReplyAddress("a".repeat(32),replyDomain))
  return {examined:0,sent:0,enabled:false,readinessReason:"REPLY_DOMAIN_INVALID",
   operatorAlert:"Recruiter email reply domain is not verified"};
 const db=getDb();
 const [ready]=await db.execute<{ok:boolean}>(sql`
  select to_regclass('public.placement_recruiter_message_mail_state') is not null
   and to_regclass('public.placement_recruiter_inbound_email_events') is not null
   and exists(select 1 from information_schema.columns where table_name='placement_tpo_messages'
    and column_name='delivery_channel') as ok
 `).then(result=>result.rows);
 if(!ready?.ok)return {examined:0,sent:0,enabled:false,
  readinessReason:"SCHEMA_NOT_READY",operatorAlert:"Recruiter email bridge database setup is incomplete"};
 const due=await db.execute<Candidate>(sql`
  select t.id as thread_id,t.recruiter_user_id,u.email as recipient_email,
    u.display_name as recipient_name,t.college_id,
    c.name as college_name,company.name as company_name,
    min(m.created_at) as first_unread_at,max(m.created_at) as last_unread_at
  from placement_tpo_message_threads t
  join placement_tpo_messages m on m.thread_id=t.id and m.sender_type='TPO' and m.read_at is null
  left join placement_recruiter_message_mail_state state on state.thread_id=t.id
  left join placement_tpo_messages notified on notified.id=state.last_notified_message_id
  join users u on u.id=t.recruiter_user_id and u.platform_status='ACTIVE'
  join placement_recruiter_profiles p on p.user_id=u.id and p.status='ACTIVE'
  join placement_recruiter_college_grants g on g.recruiter_user_id=u.id
    and g.status='ACTIVE' and g.verification_status='VERIFIED'
    and g.valid_until > ${now} and 'DRIVES'=any(g.capabilities)
  join placement_company_relationships r on r.id=g.company_relationship_id
    and r.company_id=p.company_id and r.college_id=t.college_id and r.status='ACTIVE'
  and (t.job_id is null or exists(select 1 from placement_jobs j
    where j.id=t.job_id and j.college_id=t.college_id and j.company_relationship_id=r.id))
  join placement_companies company on company.id=p.company_id and company.status='ACTIVE'
  join colleges c on c.id=t.college_id and c.status='ACTIVE'
  where u.email is not null and (notified.id is null or
    m.created_at>notified.created_at or
    (m.created_at=notified.created_at and m.id>notified.id))
  group by t.id,t.recruiter_user_id,u.email,u.display_name,t.college_id,c.name,company.name
  order by min(m.created_at),t.id limit 100
 `);
 let sent=0,failed=0;
 for(const candidate of due.rows){
  try{
  const success=await db.transaction(async tx=>{
   await tx.insert(placementRecruiterMessageMailState).values({
     threadId:candidate.thread_id,recruiterUserId:candidate.recruiter_user_id,
   }).onConflictDoNothing();
   const [state]=await tx.select().from(placementRecruiterMessageMailState)
    .where(eq(placementRecruiterMessageMailState.threadId,candidate.thread_id))
    .for("update").limit(1);
   if(!state||state.recruiterUserId!==candidate.recruiter_user_id)return false;
   // The due-list query is only a snapshot. Recheck current recruiter, company,
   // college, job and DRIVES grant inside this locked send transaction: a
   // revoked grant or changed recipient email must not receive a digest.
   const grant=await tx.execute<{allowed:boolean}>(sql`
    select exists(
     select 1 from placement_tpo_message_threads t
     join users u on u.id=t.recruiter_user_id and u.platform_status='ACTIVE'
     join placement_recruiter_profiles p on p.user_id=u.id and p.status='ACTIVE'
     join placement_recruiter_college_grants g on g.recruiter_user_id=u.id
       and g.status='ACTIVE' and g.verification_status='VERIFIED'
       and g.valid_until > clock_timestamp() and 'DRIVES'=any(g.capabilities)
     join placement_company_relationships r on r.id=g.company_relationship_id
       and r.company_id=p.company_id and r.college_id=t.college_id and r.status='ACTIVE'
     join placement_companies co on co.id=p.company_id and co.status='ACTIVE'
     join colleges c on c.id=t.college_id and c.status='ACTIVE'
     where t.id=${candidate.thread_id}::uuid
       and t.recruiter_user_id=${candidate.recruiter_user_id}::uuid
       and lower(u.email)=lower(${candidate.recipient_email}::text)
       and (t.job_id is null or exists(
         select 1 from placement_jobs j where j.id=t.job_id
           and j.college_id=t.college_id and j.company_relationship_id=r.id
       ))
    ) as allowed
   `);
   if(grant.rows[0]?.allowed!==true)return false;
   const messages=await tx.select({id:placementTpoMessages.id,body:placementTpoMessages.body,
      createdAt:placementTpoMessages.createdAt})
    .from(placementTpoMessages).where(and(
      eq(placementTpoMessages.threadId,candidate.thread_id),
      eq(placementTpoMessages.senderType,"TPO"),isNull(placementTpoMessages.readAt),
      state.lastNotifiedMessageId?sql`(${placementTpoMessages.createdAt},${placementTpoMessages.id}) >
       (select created_at,id from placement_tpo_messages where id=${state.lastNotifiedMessageId}::uuid)`:undefined))
    .orderBy(desc(placementTpoMessages.createdAt),desc(placementTpoMessages.id)).limit(3);
   if(!messages.length)return false;
   const first=new Date(candidate.first_unread_at),last=messages[0].createdAt;
   if(!isRecruiterUnreadReminderDue({firstUnreadAt:first,lastMessageAt:last,
     lastSentAt:state.lastSentAt,now}))return false;
   const token=recruiterReplyTokenForThread(replySecret,candidate.thread_id);
   if(!token)return false;
   const replyTo=makeRecruiterReplyAddress(token,replyDomain);
   if(!replyTo)return false;
   const accepted=await sendRecruiterMessageDigest({
    recipient:candidate.recipient_email,
    recipientName:candidate.recipient_name?.trim().split(/\s+/)[0] || "Recruiter",
    collegeId:candidate.college_id,
    companyName:candidate.company_name,collegeName:candidate.college_name,
    replyTo,messages:[...messages].reverse(),
   },env);
   if(!accepted){
    // Reserve a short retry slot on provider errors instead of flooding
    // a failed gateway every time the scheduler polls.
    await tx.update(placementRecruiterMessageMailState).set({lastSentAt:now,
      updatedAt:now}).where(eq(placementRecruiterMessageMailState.threadId,candidate.thread_id));
    return false;
   }
   await tx.update(placementRecruiterMessageMailState).set({
     lastSentAt:now,lastNotifiedMessageId:messages[0].id,
     replyTokenHash:createHash("sha256").update(token).digest("hex"),
     replyTokenExpiresAt:new Date(now.getTime()+90*24*60*60_000),
     updatedAt:now,
   }).where(eq(placementRecruiterMessageMailState.threadId,candidate.thread_id));
   return true;
  });
  if(success)sent++;else failed++;
  }catch{failed++; /* Isolate each thread; no private recipient data in logs. */}
 }
 return {examined:due.rows.length,sent,failed,enabled:true,readinessReason:"READY"};
}


/** Four days after an unanswered invitation, the TPO may send a single
 * reminder. The original bearer token is hashed and cannot be reconstructed,
 * so this email NEVER includes a made-up or unverified invite URL.
 * Schedule this worker at 09:00 Asia/Kolkata, separately from message digests.
 */
export async function dispatchPendingRecruiterInviteReminders(
 env:Record<string,string|undefined>=process.env,now=new Date(),
):Promise<MailSummary>{
 const enabled=env.TPO_RECRUITER_INVITE_REMINDER_ENABLED==="true";
 const templateName="RECRUITER_INVITE_REMINDER";
 if(!enabled)return {enabled:false,examined:0,sent:0,
  readinessReason:"REMINDER_DISABLED",operatorAlert:"Recruiter invite reminder worker is disabled"};
 const hour=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",
  hourCycle:"h23"}).format(now);
 if(hour!=="09")return {enabled:true,examined:0,sent:0,readinessReason:"OUTSIDE_SCHEDULE"};
 if(!resolveZeptoMailTemplateId({kind:"TPO",templateName},env))
  return {enabled:false,examined:0,sent:0,readinessReason:"TEMPLATE_NOT_CONFIGURED",
   operatorAlert:"Recruiter invitation reminder email template is not configured"};
 const mail=readZeptoMailConfig(env);
 if(!mail.token.trim())return {enabled:false,examined:0,sent:0,
  readinessReason:"PROVIDER_NOT_CONFIGURED",operatorAlert:"Email provider credentials are missing"};
 const db=getDb();
 const due=await db.select({
  id:placementTpoLeads.id,collegeId:placementTpoLeads.collegeId,
  recipient:placementTpoLeads.emailNorm,name:placementTpoLeads.name,
  companyName:placementTpoLeads.companyName,collegeName:colleges.name,
 }).from(placementTpoLeads)
  .innerJoin(colleges,eq(colleges.id,placementTpoLeads.collegeId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementTpoLeads.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementTpoLeads.collegeId)))
  .where(and(eq(colleges.status,"ACTIVE"),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   isNull(placementTpoLeads.inviteClickedAt),
   isNull(placementTpoLeads.inviteBouncedAt),
   isNull(placementTpoLeads.unsubscribedAt),
   isNull(placementTpoLeads.recruiterUserId),
   isNull(placementTpoLeads.inviteReminderSentAt),
   sql`${placementTpoLeads.inviteTokenHash} is not null`,
   lt(placementTpoLeads.inviteSentAt,new Date(now.getTime()-4*86400000))))
  .orderBy(placementTpoLeads.inviteSentAt,placementTpoLeads.id).limit(100);
 let sent=0,failed=0;
 for(const lead of due){
  try{
   if(!lead.recipient){continue;}
   // Claim before an external send: simultaneous scheduler replicas must not
   // send the same reminder. A definite provider rejection releases the claim;
   // ambiguous transport failures retain it to avoid accidental duplicates.
   const claimed=await db.update(placementTpoLeads).set({
    inviteReminderSentAt:now,updatedAt:now,
   }).where(and(eq(placementTpoLeads.id,lead.id),
    eq(placementTpoLeads.collegeId,lead.collegeId),
    isNull(placementTpoLeads.inviteReminderSentAt),
    isNull(placementTpoLeads.inviteClickedAt),
    isNull(placementTpoLeads.recruiterUserId),
    isNull(placementTpoLeads.unsubscribedAt),
    isNull(placementTpoLeads.inviteBouncedAt)))
   .returning({id:placementTpoLeads.id});
   if(!claimed.length)continue;
   const result=await sendZeptoMailTemplate({
    purpose:{kind:"TPO",templateName},toEmail:lead.recipient,
    recipientName:lead.name,
    mergeInfo:{name:lead.name,college:lead.collegeName,company:lead.companyName??"",
     instruction:"Contact the placement cell for a new invitation link."},
   },mail,fetch,env);
   if(result.accepted){sent++;continue;}
   failed++;
   // Known invalid configuration/recipient is not transient, and cannot be
   // corrected by polling. Keep the claimed marker and raise readiness alert.
  }catch{failed++;}
 }
 return {enabled:true,examined:due.length,sent,failed,
  readinessReason:failed?"DELIVERY_FAILURE":"READY",
  ...(failed?{operatorAlert:"Some recruiter invitation reminders were not accepted. Review provider setup."}:{})};
}
