import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema/activity";
import {inAppNotifications} from "@/db/schema";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {placementTpoNoticeAudiences,placementTpoNoticeRecipients} from "@/db/schema/placement-tpo-notice-audiences";
import {tpoNoticeAudienceChangeSchema,mayChangeTpoNoticeAudience} from "./tpo-notice-audience-change-model";
import {freezeTpoNoticeRecipients} from "./tpo-notice-audience-snapshot-model";
import {tpoTargetedRecipientQuery} from "./tpo-targeted-recipient-query";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {parseTpoNoticeSchedule,parseTpoIstMinute} from "./tpo-notice-schedule-model";

export const editTpoNoticeSchema=z.object({
 noticeId:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),
 title:z.string().trim().min(1,{error:"Give it a title"}).max(200,{error:"Title must be 200 characters or fewer"}),
 message:z.string().trim().min(1,{error:"Write the announcement"}).max(8000,{error:"Announcement must be 8000 characters or fewer"}),
 pinned:z.boolean(),
 buttonLabel:z.string().trim().min(1).max(60).optional(),
 buttonUrl:z.string().trim().max(500).regex(/^https:\/\/[^\s]+$/,"The link has to start with https://").optional(),
 notifyChanged:z.boolean().default(false),
 // Legacy PUT tellAgain is an alias of vNext notifyChanged. Email fan-out
 // is a separate explicitly configured producer, never implied by a boolean.
 tellAgain:z.boolean().optional(),
 audienceChange:tpoNoticeAudienceChangeSchema.optional(),
 sendAt:z.string().max(16).optional(),showUntil:z.string().max(16).optional(),
}).strict().refine(data=>Boolean(data.buttonLabel)===Boolean(data.buttonUrl),{path:["buttonUrl"],message:"The link has to start with https://"});

/** College-scoped, version-locked TPO notice edits; no external email/SMS side effects. */
export async function editTpoNotice(context:RequestContext,raw:unknown){
 const input=editTpoNoticeSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("announcements"))throw new Error("ANNOUNCEMENTS_NOT_REGISTERED");
 if(input.audienceChange&&(!await placementTableExists("placement_tpo_notice_audiences")||
   !await placementTableExists("placement_tpo_notice_recipients")))
  throw new Error("TARGETED_NOTICES_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [current]=await tx.select({
   id:db10Announcements.id,version:db10Announcements.version,
   scheduledAt:db10Announcements.scheduledAt,expiresAt:db10Announcements.expiresAt,
   deletedAt:db10Announcements.deletedAt,
  }).from(db10Announcements).where(and(
   eq(db10Announcements.id,input.noticeId),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.organizationId,college.organizationId),
   eq(db10Announcements.receiverType,"COLLEGE"),
   eq(db10Announcements.receiverId,college.id),
   eq(db10Announcements.senderType,"TPO"),
   isNull(db10Announcements.deletedAt),
  )).for("update").limit(1);
  if(!current)throw new Error("ANNOUNCEMENT_NOT_FOUND");
  if(current.version!==input.expectedVersion)throw new Error("ANNOUNCEMENT_STALE");
  const now=new Date();
  const schedule=input.sendAt!==undefined||input.showUntil!==undefined?
   {
    scheduledAt:input.sendAt!==undefined?parseTpoIstMinute(input.sendAt):current.scheduledAt,
    expiresAt:input.showUntil!==undefined?parseTpoIstMinute(input.showUntil):current.expiresAt,
   }:{scheduledAt:current.scheduledAt,expiresAt:current.expiresAt};
  // VNext datetime-local is IST civil time; source legacy sendAt was an
  // instant. Keep untouched schedule fields on partial edits and revalidate
  // the resulting entire send/end window against current UTC instant.
  if((input.sendAt!==undefined&&schedule.scheduledAt&&schedule.scheduledAt<new Date(now.getTime()-60_000))||
    (input.showUntil!==undefined&&schedule.expiresAt&&
      schedule.expiresAt<=new Date(Math.max(now.getTime(),schedule.scheduledAt?.getTime()??0))))
    throw new Error("TPO_NOTICE_INVALID_TIME");
  if(input.sendAt!==undefined&&input.showUntil!==undefined)
    parseTpoNoticeSchedule(input,now);
  if(input.audienceChange){
   // Never retarget a visible/delivered notice. The lock covers the frozen
   // recipient set and the version-checked content update together.
   const [sent]=await tx.select({eventId:inAppNotifications.eventId})
    .from(inAppNotifications).innerJoin(activityEvents,
     eq(activityEvents.id,inAppNotifications.eventId))
    .where(and(eq(activityEvents.collegeId,college.id),
     eq(activityEvents.subjectType,"announcement"),
     eq(activityEvents.subjectId,current.id),
     eq(activityEvents.eventType,"placements.tpo_notice.created"))).limit(1);
   const now=new Date();
   if(!mayChangeTpoNoticeAudience({scheduledAt:current.scheduledAt,now,
      delivered:Boolean(sent),deleted:Boolean(current.deletedAt)})||
      !schedule.scheduledAt||schedule.scheduledAt<=now)
    throw new Error("TPO_NOTICE_AUDIENCE_LOCKED");
   const change=input.audienceChange;
   const members=change.audience==="COLLEGE"?[]:
    (await tx.execute<{id:string}>(tpoTargetedRecipientQuery(college.id,{
     kind:change.audience,targetId:change.targetId,targetIds:change.targetIds,
    }))).rows.map(row=>row.id);
   const frozen=freezeTpoNoticeRecipients(members);
   if(change.audience!=="COLLEGE"&&!frozen.length)
    throw new Error("TPO_NOTICE_NO_RECIPIENTS");
   await tx.delete(placementTpoNoticeRecipients).where(
    eq(placementTpoNoticeRecipients.announcementId,current.id));
   await tx.delete(placementTpoNoticeAudiences).where(
    eq(placementTpoNoticeAudiences.announcementId,current.id));
   if(change.audience!=="COLLEGE"){
    await tx.insert(placementTpoNoticeAudiences).values({
     announcementId:current.id,kind:change.audience,
    });
    for(let offset=0;offset<frozen.length;offset+=500)
     await tx.insert(placementTpoNoticeRecipients).values(
      frozen.slice(offset,offset+500).map(membershipId=>({
       announcementId:current.id,membershipId,
      })));
   }
  }
  const [updated]=await tx.update(db10Announcements).set({
   title:input.title,message:input.message,isPinned:input.pinned,
   buttonLabel:input.buttonLabel??null,buttonUrl:input.buttonUrl??null,
   scheduledAt:schedule.scheduledAt,expiresAt:schedule.expiresAt,
   version:current.version+1,updatedAt:new Date(),
  }).where(and(
   eq(db10Announcements.id,current.id),
   eq(db10Announcements.version,input.expectedVersion),
   isNull(db10Announcements.deletedAt),
  )).returning({id:db10Announcements.id,version:db10Announcements.version});
  if(!updated)throw new Error("ANNOUNCEMENT_STALE");
  const [editEvent]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"placements.tpo_notice.edited",
   subjectType:"announcement",subjectId:updated.id,
   summary:"TPO notice content or schedule edited",
   metadata:{noticeId:updated.id,version:updated.version,pinned:input.pinned,
    notifyChanged:input.notifyChanged||input.tellAgain===true,
    legacyTellAgain:input.tellAgain??null,
    audienceChangedTo:input.audienceChange?.audience??null},
  }).returning({id:activityEvents.id});
  if((input.notifyChanged||input.tellAgain===true) && editEvent){
   // Tell ONLY recipients with a persisted original notification. A notice
   // published without a delivery producer cannot magically notify students.
   const original=await tx.select({id:activityEvents.id}).from(activityEvents)
    .where(and(eq(activityEvents.collegeId,college.id),
     eq(activityEvents.organizationId,college.organizationId),
     eq(activityEvents.subjectType,"announcement"),eq(activityEvents.subjectId,updated.id),
     eq(activityEvents.eventType,"placements.tpo_notice.created"))).limit(1);
   if(original[0]){
    const recipients=await tx.select({userId:inAppNotifications.userId})
     .from(inAppNotifications).where(and(eq(inAppNotifications.eventId,original[0].id),
       isNull(inAppNotifications.deletedAt)));
    // Frozen original recipients only; never retarget from a new cohort or
    // section after the first delivery, and batch large fan-outs safely.
    const unique=[...new Set(recipients.map(row=>row.userId))];
    for(let offset=0;offset<unique.length;offset+=500)
     await tx.insert(inAppNotifications).values(unique.slice(offset,offset+500).map(userId=>({
      userId,eventId:editEvent.id,title:"Announcement updated: "+input.title.slice(0,100),
      body:"The placement cell changed an announcement. Open it for the latest details.",
      actionHref:"/learn/announcements",
     }))).onConflictDoNothing();
   }
  }
  return updated;
 });
}
