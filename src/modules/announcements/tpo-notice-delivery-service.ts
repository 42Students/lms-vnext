import "server-only";
import {and,eq,gt,isNull,lte,inArray,or,sql,asc,exists} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoNoticeAudiences,placementTpoNoticeRecipients}
 from "@/db/schema/placement-tpo-notice-audiences";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";

/** Parse legacy local wall-clock schedule into an explicit IST instant. Old
 * yyyy-MM-dd HH:mm:ss was a LocalDateTime, while ISO Z/offset timestamps
 * represent actual instants. Malformed dates must not silently mean send now.
 */
export function parseLegacyTpoNoticeSchedule(raw:unknown):{
 ok:true;scheduledAt:Date|null;
}|{ok:false;message:string}{
 if(raw===null||raw===undefined||raw==="")return {ok:true,scheduledAt:null};
 if(typeof raw!=="string")return {ok:false,message:"Choose a valid schedule date and time."};
 const value=raw.trim();
 if(!value)return {ok:true,scheduledAt:null};
 const local=value.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})[ T]([0-9]{2}:[0-9]{2})(?::([0-9]{2}))?$/);
 const iso=/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:[.][0-9]{1,3})?)?(?:Z|[+-][0-9]{2}:[0-9]{2})$/i;
 const parsed=local?new Date(local[1]+"T"+local[2]+":"+(local[3]??"00")+"+05:30"):
  iso.test(value)?new Date(value):null;
 if(!parsed||!Number.isFinite(parsed.getTime()))
  return {ok:false,message:"Choose a valid schedule date and time."};
 // Java LocalDateTime rejected impossible days; JavaScript Date otherwise
 // normalizes 31 February or minute 60 into a different scheduled instant.
 if(local){
  const normalized=new Date(parsed.getTime()+330*60_000).toISOString().slice(0,19);
  if(normalized!==local[1]+"T"+local[2]+":"+(local[3]??"00"))
   return {ok:false,message:"Choose a valid schedule date and time."};
 }
 return {ok:true,scheduledAt:parsed};
}

export const TPO_NOTICE_DELIVERY_BATCH_LIMIT=200;
export const TPO_NOTICE_DELIVERY_HOLD_MS=30_000;
export const TPO_NOTICE_DELIVERY_JOBS=[
 "Placement announcement delivery","Deadline-today reminder","Shortlist notification",
] as const;

/** Call from an authenticated scheduler. Never from GET or a browser render.
 * A 30-second hold permits author Undo before any notification is enqueued.
 * Existing (user,event) uniqueness makes delivery idempotent on retries.
 */
async function recordTpoNoticeReleaseFailure(
 notice:{id:string;collegeId:string;organizationId:string},
 now:Date,code:"AUDIENCE_UNAVAILABLE"|"DELIVERY_FAILED",
){
 // One durable operator-visible failure per notice/five-minute bucket, not
 // one notification to every learner for each scheduler retry.
 await getDb().insert(activityEvents).values({
  organizationId:notice.organizationId,collegeId:notice.collegeId,
  module:"PLACEMENTS",eventType:"placements.tpo_notice.delivery_failed",
  importance:"HIGH",subjectType:"announcement",subjectId:notice.id,
  summary:"Placement announcement delivery failed",
  dedupeKey:"tpo-notice-failed:"+notice.id+":"+Math.floor(now.getTime()/300_000),
  metadata:{deliveryStatus:"FAILED",deliveryError:code,retryable:true},
 }).onConflictDoNothing();
}

export async function deliverDueTpoNotices(now=new Date(),onlyAnnouncementId?:string){
 if(!await placementTableExists("announcements")||
    !await placementTableExists("placement_tpo_notice_audiences")||
    !await placementTableExists("placement_tpo_notice_recipients"))
  return {ready:false as const,scanned:0,delivered:0,failed:0,
    failures:[] as {announcementId:string;status:"FAILED";retryable:true}[]};
 const db=getDb(),cutoff=new Date(now.getTime()-TPO_NOTICE_DELIVERY_HOLD_MS);
 const due=await db.select({
  id:db10Announcements.id,collegeId:db10Announcements.collegeId,
  organizationId:db10Announcements.organizationId,
  title:db10Announcements.title,message:db10Announcements.message,
 }).from(db10Announcements).where(and(
  eq(db10Announcements.senderType,"TPO"),
  eq(db10Announcements.receiverType,"COLLEGE"),
  onlyAnnouncementId?eq(db10Announcements.id,onlyAnnouncementId):undefined,
  isNull(db10Announcements.deletedAt),
  lte(db10Announcements.createdAt,cutoff),
  // Undo lasts for 30 seconds after the actual scheduled release,
  // not only 30 seconds after the author drafted the notice.
  or(isNull(db10Announcements.scheduledAt),lte(db10Announcements.scheduledAt,cutoff)),
  or(isNull(db10Announcements.expiresAt),gt(db10Announcements.expiresAt,now)),
  sql`not exists(select 1 from in_app_notifications n
   join activity_events e on e.id=n.event_id
   where e.college_id=${db10Announcements.collegeId}
     and e.subject_type='announcement'
     and e.subject_id=${db10Announcements.id}
     and e.event_type='placements.tpo_notice.created')`,
  )).orderBy(asc(db10Announcements.createdAt),asc(db10Announcements.id)).limit(TPO_NOTICE_DELIVERY_BATCH_LIMIT);
 let delivered=0,scanned=0;
 const failures:{announcementId:string;status:"FAILED";retryable:true}[]=[];
 for(const notice of new Map(due.map(row=>[row.id,row])).values()){
  scanned++;
  // Each announcement is an independent atomic release. A broken notice
  // must not discard deliveries for the other due announcements; unfinished
  // ones remain retryable because no partial event batch is committed.
  let result=0;
  try {
   result=await db.transaction(async tx=>{
   const [active]=await tx.select({
    id:db10Announcements.id,scheduledAt:db10Announcements.scheduledAt,
    expiresAt:db10Announcements.expiresAt,deletedAt:db10Announcements.deletedAt,
   }).from(db10Announcements).where(eq(db10Announcements.id,notice.id)).for("update").limit(1);
   if(!active||active.deletedAt||active.scheduledAt&&active.scheduledAt>cutoff||
      active.expiresAt&&active.expiresAt<=now)return 0;
   const [event]=await tx.select({id:activityEvents.id,metadata:activityEvents.metadata})
    .from(activityEvents).where(and(
     eq(activityEvents.collegeId,notice.collegeId),
     eq(activityEvents.subjectType,"announcement"),
     eq(activityEvents.subjectId,notice.id),
     eq(activityEvents.eventType,"placements.tpo_notice.created"),
    )).limit(1);
   if(!event)return -1;
   const [target]=await tx.select({kind:placementTpoNoticeAudiences.kind})
    .from(placementTpoNoticeAudiences)
    .where(eq(placementTpoNoticeAudiences.announcementId,notice.id)).limit(1);
   // Before explicit COLLEGE rows were inserted, the signed-in writer
   // recorded a trusted college-wide audience in its same-transaction event.
   // Recover those earlier notices only when the event explicitly says COLLEGE;
   // for every targeted/unknown audience, fail closed rather than widening.
   const audienceKind=target?.kind??(event.metadata?.["audience"]==="COLLEGE"?"COLLEGE":null);
   if(!audienceKind)return -1;
   const learners=exists(tx.select({id:membershipRoles.id})
     .from(membershipRoles).where(and(
       eq(membershipRoles.membershipId,collegeMemberships.id),
       eq(membershipRoles.role,"LEARNER"),
     )));
   const members=await tx.selectDistinct({userId:collegeMemberships.userId})
    .from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(
     eq(collegeMemberships.collegeId,notice.collegeId),
     eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
     // College-wide placement notices are addressed to students, not staff.
     // Narrower audiences must also belong to the persisted recipient set.
     learners,
     ...(audienceKind==="COLLEGE"?[]:[
      inArray(collegeMemberships.id,
       tx.select({id:placementTpoNoticeRecipients.membershipId})
        .from(placementTpoNoticeRecipients)
        .where(eq(placementTpoNoticeRecipients.announcementId,notice.id))),
     ]),
    )).limit(20001);
   // One college can have 10,000 learners. A too-large audience cannot be
   // silently partially notified: return a detectable retryable failure.
   if(members.length>20000)return -1;
   let done=0;
   for(let offset=0;offset<members.length;offset+=250){
    const result=await deliverInAppNotificationInTransaction(
     tx,event.id,members.slice(offset,offset+250).map(row=>row.userId),{
      title:notice.title.slice(0,240),
      body:notice.message.slice(0,2000),
      actionHref:"/learn/my-placements/announcements?focus="+encodeURIComponent(notice.id),
     });
    done+=result.delivered;
   }
   return done;
   });
  }catch{
   // Do not disclose raw database messages or claim FAILED was persisted:
   // DB10 has no durable per-release failure column yet.
   failures.push({announcementId:notice.id,status:"FAILED",retryable:true});
   await recordTpoNoticeReleaseFailure(notice,now,"DELIVERY_FAILED").catch(()=>undefined);
   continue;
  }
  if(result<0){
   failures.push({announcementId:notice.id,status:"FAILED",retryable:true});
   await recordTpoNoticeReleaseFailure(notice,now,"AUDIENCE_UNAVAILABLE").catch(()=>undefined);
   continue;
  }
  if(result>0){
   // Success resolves an earlier alert without deleting its audit history.
   await db.insert(activityEvents).values({
    organizationId:notice.organizationId,collegeId:notice.collegeId,
    module:"PLACEMENTS",eventType:"placements.tpo_notice.delivery_succeeded",
    subjectType:"announcement",subjectId:notice.id,
    summary:"Placement announcement delivered",
    dedupeKey:"tpo-notice-delivered:"+notice.id,
    metadata:{deliveryStatus:"SENT",recipientCount:result},
   }).onConflictDoNothing().catch(()=>undefined);
  }
  delivered+=result;
 }
 return {ready:true as const,scanned,delivered,failed:failures.length,failures};
}

/** Separate live scheduled producers; generic notices never replace their eligibility rules. */
export {queueEligibleDeadlineTodayReminders} from "./tpo-deadline-today-job-service";
export {queueFencedInterviewReminderEmails} from "./tpo-interview-reminder-email-service";
