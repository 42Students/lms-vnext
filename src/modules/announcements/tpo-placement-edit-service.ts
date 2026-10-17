import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema/activity";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {parseTpoNoticeSchedule} from "./tpo-notice-schedule-model";

export const editTpoNoticeSchema=z.object({
 noticeId:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),
 title:z.string().trim().min(1).max(200),
 message:z.string().trim().min(1).max(8000),
 pinned:z.boolean(),
 buttonLabel:z.string().trim().min(1).max(60).optional(),
 buttonUrl:z.string().trim().max(500).regex(/^https:\/\/[^\s]+$/,"The link has to start with https://").optional(),
 sendAt:z.string().max(16).optional(),showUntil:z.string().max(16).optional(),
}).strict().refine(data=>Boolean(data.buttonLabel)===Boolean(data.buttonUrl),{path:["buttonUrl"],message:"The link has to start with https://"});

/** Author-only, version-locked notice edits; no external email/SMS side effects. */
export async function editTpoNotice(context:RequestContext,raw:unknown){
 const input=editTpoNoticeSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("announcements"))throw new Error("ANNOUNCEMENTS_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [current]=await tx.select({
   id:db10Announcements.id,version:db10Announcements.version,
   scheduledAt:db10Announcements.scheduledAt,expiresAt:db10Announcements.expiresAt,
  }).from(db10Announcements).where(and(
   eq(db10Announcements.id,input.noticeId),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.organizationId,college.organizationId),
   eq(db10Announcements.receiverType,"COLLEGE"),
   eq(db10Announcements.receiverId,college.id),
   eq(db10Announcements.senderType,"TPO"),
   eq(db10Announcements.senderUserId,context.user.id),
   isNull(db10Announcements.deletedAt),
  )).for("update").limit(1);
  if(!current)throw new Error("ANNOUNCEMENT_NOT_FOUND");
  if(current.version!==input.expectedVersion)throw new Error("ANNOUNCEMENT_STALE");
  const schedule=input.sendAt!==undefined||input.showUntil!==undefined?
   parseTpoNoticeSchedule(input,new Date()):
   {scheduledAt:current.scheduledAt,expiresAt:current.expiresAt};
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
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"placements.tpo_notice.edited",
   subjectType:"announcement",subjectId:updated.id,
   summary:"TPO notice content or schedule edited",
   metadata:{noticeId:updated.id,version:updated.version,pinned:input.pinned},
  });
  return updated;
 });
}
