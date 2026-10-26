import "server-only";
import {and,asc,desc,eq,gte,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveMentorProjectEmailPreflight} from
 "./mentor-project-email-dispatch-preflight-service";
import {sendMentorProjectEventEmail} from "./mentor-project-email-provider";

const QUEUED=ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_QUEUED;
const STATE=ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_EMAIL_DISPATCH_STATE;
const RECEIPT="mentor_project_email_dispatch_receipt";
const TERMINAL=["ACCEPTED","SUPPRESSED","EXHAUSTED"] as const;
const MAX_ATTEMPTS=3;
const LEASE_MS=20*60*1000;
type Job={
 id:string;collegeId:string|null;organizationId:string|null;
 metadata:Record<string,unknown>;
};
type Claim={id:string;attempt:number};
type State="CLAIMED"|"ACCEPTED"|"SUPPRESSED"|"RETRY"|"EXHAUSTED";

function jobIdentity(job:Job){
 const sourceEventId=job.metadata["sourceEventId"];
 const recipientUserId=job.metadata["recipientUserId"];
 const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
 return typeof sourceEventId==="string"&&uuid.test(sourceEventId)&&
  typeof recipientUserId==="string"&&uuid.test(recipientUserId)
    ?{sourceEventId,recipientUserId}:null;
}
export function mentorProjectEmailWorkerReady(
 env:Record<string,string|undefined>=process.env,
 now:Date=new Date(),
):{ready:true;activatedAt:Date}|{ready:false}{
 if(env["MENTOR_PROJECT_EMAIL_OUTBOX_READY"]!=="verified"||
    env["MENTOR_PROJECT_EMAIL_DISPATCH_READY"]!=="verified"||
    env["ZEPTOMAIL_IDEMPOTENCY_SUPPORTED"]!=="confirmed")
  return {ready:false};
 const since=env["MENTOR_PROJECT_EMAIL_ACTIVATED_AT"];
 if(!since||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(since))
  return {ready:false};
 const activatedAt=new Date(since);
 if(!Number.isFinite(activatedAt.getTime())||
   activatedAt.getTime()>now.getTime())return {ready:false};
 return {ready:true,activatedAt};
}
function receiptValues(job:Job,status:State,attempt:number){
 return {
  organizationId:job.organizationId,collegeId:job.collegeId,
  module:"PROJECTS" as const,eventType:STATE,
  subjectType:RECEIPT,subjectId:job.id,
  summary:"Mentor email dispatch state recorded",
  metadata:{status,attempt},
  groupKey:"mentor:email-delivery:"+job.id,
 };
}
async function claimJob(job:Job):Promise<Claim|null>{
 return getDb().transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${job.id}, 61))`);
  const [prior]=await tx.select({
   id:activityEvents.id,occurredAt:activityEvents.occurredAt,
   metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
   eq(activityEvents.eventType,STATE),
   eq(activityEvents.subjectType,RECEIPT),
   eq(activityEvents.subjectId,job.id),
   eq(activityEvents.collegeId,job.collegeId!),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  const status=prior?.metadata["status"];
  if(TERMINAL.some(item=>item===status))return null;
  const prevAttempt=prior?.metadata["attempt"];
  const attempts=typeof prevAttempt==="number"&&Number.isSafeInteger(prevAttempt)
    ?prevAttempt:0;
  if(status==="CLAIMED"&&prior&&
    prior.occurredAt.getTime()>Date.now()-LEASE_MS)return null;
  if(attempts>=MAX_ATTEMPTS){
   await tx.insert(activityEvents)
    .values(receiptValues(job,"EXHAUSTED",attempts));
   return null;
  }
  const attempt=attempts+1;
  const [claimed]=await tx.insert(activityEvents)
   .values(receiptValues(job,"CLAIMED",attempt))
   .returning({id:activityEvents.id});
  return claimed?{id:claimed.id,attempt}:null;
 });
}
async function settleJob(job:Job,claim:Claim,status:State){
 await getDb().transaction(async tx=>{
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${job.id}, 61))`);
  const [latest]=await tx.select({id:activityEvents.id})
   .from(activityEvents).where(and(
    eq(activityEvents.eventType,STATE),
    eq(activityEvents.subjectType,RECEIPT),
    eq(activityEvents.subjectId,job.id),
    eq(activityEvents.collegeId,job.collegeId!),
   )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  if(latest?.id!==claim.id)return;
  await tx.insert(activityEvents).values(receiptValues(job,status,claim.attempt));
 });
}
/** Each queued intent is durable and unique at the producer transaction.
 * CLAIMED/settled receipts serialize workers without storing recipient PII.
 * An ambiguous provider timeout can be retried only with an attested,
 * deterministic ZeptoMail idempotency key. ACCEPTED is not delivery proof.
 */
export async function runMentorProjectEmailDispatchBatch(
 env:Record<string,string|undefined>=process.env,
):Promise<{status:"DISABLED"|"CHECKED";examined:number;accepted:number;
 suppressed:number;retry:number}>{
 const state=mentorProjectEmailWorkerReady(env);
 const result={examined:0,accepted:0,suppressed:0,retry:0};
 if(!state.ready)return {status:"DISABLED",...result};
 const jobs=await getDb().select({
  id:activityEvents.id,organizationId:activityEvents.organizationId,
  collegeId:activityEvents.collegeId,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
  eq(activityEvents.eventType,QUEUED),
  eq(activityEvents.subjectType,"mentor_project_email_job"),
  gte(activityEvents.occurredAt,state.activatedAt),
  sql`not exists (
    select 1 from activity_events settled
    where settled.subject_type=${RECEIPT}
      and settled.subject_id=${activityEvents.id}::text
      and settled.event_type=${STATE}
      and settled.metadata ->> 'status' in ('ACCEPTED','SUPPRESSED','EXHAUSTED')
  )`,
 )).orderBy(asc(activityEvents.occurredAt),asc(activityEvents.id)).limit(10);
 for(const job of jobs){
  if(!job.collegeId||!job.organizationId)continue;
  const claim=await claimJob(job);
  if(!claim)continue;
  result.examined++;
  let terminal:State="RETRY";
  try{
   const ids=jobIdentity(job);
   const source=ids?await resolveMentorProjectEmailPreflight(
    ids.sourceEventId,ids.recipientUserId,{
     collegeId:job.collegeId,organizationId:job.organizationId,
     projectId:job.metadata["projectId"],kind:job.metadata["kind"],
    }):null;
   if(!source)terminal="SUPPRESSED";
   else{
    const sent=await sendMentorProjectEventEmail(source,env);
    terminal=sent.status==="ATTEMPTED"&&sent.provider.accepted?
      "ACCEPTED":sent.status==="SUPPRESSED"&&
      sent.reason==="NOT_OPTED_IN"?"SUPPRESSED":"RETRY";
   }
  }catch{
   terminal="RETRY";
  }
  await settleJob(job,claim,terminal);
  if(terminal==="ACCEPTED")result.accepted++;
  else if(terminal==="SUPPRESSED")result.suppressed++;
  else result.retry++;
 }
 return {status:"CHECKED",...result};
}
