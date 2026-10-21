import "server-only";
import {and,eq,gt,isNull,lte,inArray,or,sql,asc,exists} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoNoticeAudiences,placementTpoNoticeRecipients}
 from "@/db/schema/placement-tpo-notice-audiences";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {deliverInAppNotificationInTransaction} from "@/modules/activity/notification-service";

/** Call from an authenticated scheduler. Never from GET or a browser render.
 * A 30-second hold permits author Undo before any notification is enqueued.
 * Existing (user,event) uniqueness makes delivery idempotent on retries.
 */
export async function deliverDueTpoNotices(now=new Date()){
 if(!await placementTableExists("announcements")||
    !await placementTableExists("placement_tpo_notice_audiences")||
    !await placementTableExists("placement_tpo_notice_recipients"))
  return {ready:false as const,scanned:0,delivered:0,failed:0,
    failures:[] as {announcementId:string;status:"FAILED";retryable:true}[]};
 const db=getDb(),cutoff=new Date(now.getTime()-30_000);
 const due=await db.select({
  id:db10Announcements.id,collegeId:db10Announcements.collegeId,
  title:db10Announcements.title,message:db10Announcements.message,
 }).from(db10Announcements).where(and(
  eq(db10Announcements.senderType,"TPO"),
  eq(db10Announcements.receiverType,"COLLEGE"),
  isNull(db10Announcements.deletedAt),
  lte(db10Announcements.createdAt,cutoff),
  or(isNull(db10Announcements.scheduledAt),lte(db10Announcements.scheduledAt,now)),
  or(isNull(db10Announcements.expiresAt),gt(db10Announcements.expiresAt,now)),
  sql`not exists(select 1 from in_app_notifications n
   join activity_events e on e.id=n.event_id
   where e.college_id=${db10Announcements.collegeId}
     and e.subject_type='announcement'
     and e.subject_id=${db10Announcements.id}
     and e.event_type='placements.tpo_notice.created')`,
 )).orderBy(asc(db10Announcements.createdAt),asc(db10Announcements.id)).limit(100);
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
   if(!active||active.deletedAt||active.scheduledAt&&active.scheduledAt>now||
      active.expiresAt&&active.expiresAt<=now)return 0;
   const [event]=await tx.select({id:activityEvents.id})
    .from(activityEvents).where(and(
     eq(activityEvents.collegeId,notice.collegeId),
     eq(activityEvents.subjectType,"announcement"),
     eq(activityEvents.subjectId,notice.id),
     eq(activityEvents.eventType,"placements.tpo_notice.created"),
    )).limit(1);
   if(!event)return 0;
   const [target]=await tx.select({kind:placementTpoNoticeAudiences.kind})
    .from(placementTpoNoticeAudiences)
    .where(eq(placementTpoNoticeAudiences.announcementId,notice.id)).limit(1);
   // A missing audience record is an incomplete migration, not permission
   // to broadcast to all staff or all college members.
   if(!target)return 0;
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
     // Legacy TPO placement announcements address learners, not college
     // staff. A person who is also Faculty needs a verified LEARNER role
     // to receive this notice; a generic COLLEGE row is not an all-users fanout.
     learners,
     ...(target.kind!=="COLLEGE"?[inArray(collegeMemberships.id,
      tx.select({id:placementTpoNoticeRecipients.membershipId})
       .from(placementTpoNoticeRecipients)
       .where(eq(placementTpoNoticeRecipients.announcementId,notice.id)))]:[]),
    )).limit(5001);
   // Never deliver a partial selection if the entire eligible audience cannot be loaded.
   if(members.length>5000)return 0;
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
   continue;
  }
  delivered+=result;
 }
 return {ready:true as const,scanned,delivered,failed:failures.length,failures};
}
