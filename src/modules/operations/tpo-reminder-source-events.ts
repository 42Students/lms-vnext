/**
 * Legacy TPO reminder SOURCE generation. These events are candidates, not
 * evidence that a reminder was sent. A separately authenticated scheduled
 * worker must query eligible tenant-scoped data, hold a PostgreSQL fenced
 * lease, and atomically persist each idempotency key with its outbox write.
 * No recipient or provider call is made by this module.
 */
import type {ScheduledJobFence} from "./scheduled-job-runner";

const IST_OFFSET_MS=330*60_000;
const DAY_MS=24*60*60_000;
function dayInIndia(value:Date):string {
  if(!(value instanceof Date)||!Number.isFinite(value.getTime()))
    throw new Error("INVALID_TPO_REMINDER_DATE");
  return new Date(value.getTime()+IST_OFFSET_MS).toISOString().slice(0,10);
}
function nextIndiaDay(value:Date):string {
  const shifted=new Date(value.getTime()+IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(),
    shifted.getUTCMonth(),shifted.getUTCDate()+1)).toISOString().slice(0,10);
}
export type TpoDeadlineSource={
  jobId:string;collegeId:string;published:boolean;deleted:boolean;
  deadlineAt:Date;
  eligibleLearnerMembershipIds:readonly string[];
  appliedLearnerMembershipIds:readonly string[];
};
export type TpoShortlistSource={
  shareId:string;collegeId:string;recipientEmail:string|null;
  jobTitle:string;companyName:string;shortlistBy:Date;
  revoked:boolean;alreadyRemindedOnIstDate:boolean;
};
export type TpoReminderEvent=
 | {type:"DEADLINE_TODAY";jobName:"tpo.deadlineToday";eventKey:string;
    collegeId:string;membershipId:string;jobId:string}
 | {type:"SHORTLIST_DUE_TOMORROW";jobName:"tpo.shortlistDueTomorrow";
    eventKey:string;collegeId:string;shareId:string;recipientEmail:string;
    jobTitle:string;companyName:string};
const identity=/^[0-9a-f-]{36}$/i;
function safeId(value:string){return identity.test(value);}
function validEmail(value:string){return value.length<=254&&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
/** Candidates for published jobs closing TODAY in India, excluding all
 * applicants (regardless of state), scoped to verified eligible learners.
 */
export function generateDeadlineTodayEvents(
  rows:readonly TpoDeadlineSource[],now:Date,
):TpoReminderEvent[]{
  const today=dayInIndia(now),events:TpoReminderEvent[]=[],seen=new Set<string>();
  for(const row of rows.slice(0,500)){
    if(!row.published||row.deleted||!safeId(row.jobId)||!safeId(row.collegeId)||
       dayInIndia(row.deadlineAt)!==today)continue;
    const applied=new Set(row.appliedLearnerMembershipIds);
    for(const memberId of row.eligibleLearnerMembershipIds.slice(0,5001)){
      if(!safeId(memberId)||applied.has(memberId))continue;
      const eventKey=`deadline-today:${today}:${row.jobId}:${memberId}`;
      if(seen.has(eventKey))continue;
      seen.add(eventKey);
      events.push({type:"DEADLINE_TODAY",jobName:"tpo.deadlineToday",
        eventKey,collegeId:row.collegeId,jobId:row.jobId,membershipId:memberId});
      if(events.length>=200)return events;
    }
  }
  return events;
}
/** Legacy shortlist reminder is keyed by share and India date. The caller
 * MUST load the sent-event ledger in the same tenant and reject revoked shares.
 */
export function generateShortlistTomorrowEvents(
  rows:readonly TpoShortlistSource[],now:Date,
):TpoReminderEvent[]{
  const today=dayInIndia(now),tomorrow=nextIndiaDay(now);
  const events:TpoReminderEvent[]=[],seen=new Set<string>();
  for(const row of rows.slice(0,500)){
    const email=row.recipientEmail?.trim()??"";
    if(row.revoked||row.alreadyRemindedOnIstDate||!safeId(row.shareId)||
      !safeId(row.collegeId)||!validEmail(email)||
      dayInIndia(row.shortlistBy)!==tomorrow)continue;
    const eventKey=`shortlist-tomorrow:${today}:${row.shareId}`;
    if(seen.has(eventKey))continue;
    seen.add(eventKey);
    events.push({type:"SHORTLIST_DUE_TOMORROW",jobName:"tpo.shortlistDueTomorrow",
      eventKey,collegeId:row.collegeId,shareId:row.shareId,
      recipientEmail:email,jobTitle:row.jobTitle.slice(0,240),
      companyName:row.companyName.slice(0,240)});
    if(events.length>=200)break;
  }
  return events;
}
/** Invoke only from the verified worker after selecting tenant-scoped rows.
 * enqueueOnce MUST atomically claim eventKey and save the outbox entry, not
 * merely send an email. A successful claim is not provider delivery.
 */
export async function enqueueTpoReminderSourceEvents(
  fence:ScheduledJobFence,events:readonly TpoReminderEvent[],
  enqueueOnce:(event:TpoReminderEvent)=>Promise<boolean>,
):Promise<{enqueued:number;alreadyPresent:number;remaining:number}>{
  let enqueued=0,alreadyPresent=0;
  for(const event of events.slice(0,200)){
    await fence.assertCurrent();
    if(await enqueueOnce(event))enqueued++;
    else alreadyPresent++;
  }
  return{enqueued,alreadyPresent,remaining:Math.max(0,events.length-200)};
}
