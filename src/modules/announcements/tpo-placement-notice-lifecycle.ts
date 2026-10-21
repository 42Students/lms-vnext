import "server-only";
import {and,eq,isNull,isNotNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents} from "@/db/schema/activity";
import {inAppNotifications} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {canUndoTpoAnnouncementSend} from "./tpo-notice-undo-model";

function deletingAction(action:"DELETE"|"RESTORE"|"UNDO_SEND"){return action!=="RESTORE";}

export const tpoNoticeLifecycleSchema=z.object({
 noticeId:z.string().uuid(),action:z.enum(["DELETE","RESTORE","UNDO_SEND"]),
 expectedVersion:z.number().int().nonnegative(),
}).strict();

/** An authorized TPO colleague may delete, restore, or undo a same-college notice; version and state checked in the same CAS. */
export async function mutateTpoNotice(context:RequestContext,raw:unknown){
 const input=tpoNoticeLifecycleSchema.parse(raw);
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
   deletedAt:db10Announcements.deletedAt,
   createdAt:db10Announcements.createdAt,
   scheduledAt:db10Announcements.scheduledAt,
  }).from(db10Announcements).where(and(
   eq(db10Announcements.id,input.noticeId),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.organizationId,college.organizationId),
   eq(db10Announcements.receiverType,"COLLEGE"),
   eq(db10Announcements.receiverId,college.id),
   eq(db10Announcements.senderType,"TPO"),
  )).for("update").limit(1);
  if(!current)throw new Error("ANNOUNCEMENT_NOT_FOUND");
  if(current.version!==input.expectedVersion)throw new Error("ANNOUNCEMENT_STALE");
  if(deletingAction(input.action) && current.deletedAt || input.action==="RESTORE" && !current.deletedAt)
   throw new Error("ANNOUNCEMENT_STALE");
  const now=new Date();
  // A notice scheduled days ago must not lose its 30-second send undo window
  // merely because its draft was authored earlier. Before scheduled delivery
  // it can still be deleted normally, but it has not yet been "sent".
  if(input.action==="UNDO_SEND"){
   if(current.scheduledAt && current.scheduledAt>now)
    throw new Error("ANNOUNCEMENT_NOT_SENT");
   const sentAt=current.scheduledAt??current.createdAt;
   if(!canUndoTpoAnnouncementSend(sentAt,now))
    throw new Error("ANNOUNCEMENT_UNDO_EXPIRED");
  }
  const deleting=input.action==="DELETE"||input.action==="UNDO_SEND";
  const [updated]=await tx.update(db10Announcements).set({
   version:current.version+1,updatedAt:now,
   deletedAt:deleting?now:null,
   deletedByUserId:deleting?context.user.id:null,
  }).where(and(
   eq(db10Announcements.id,current.id),eq(db10Announcements.version,input.expectedVersion),
   deleting?isNull(db10Announcements.deletedAt):isNotNull(db10Announcements.deletedAt),
  )).returning({id:db10Announcements.id,version:db10Announcements.version});
  if(!updated)throw new Error("ANNOUNCEMENT_STALE");
  // Withdraw already-delivered notice alerts inside the same transaction.
  // No fabricated retraction count: only the original creation event's
  // actual persisted recipients are removed, never other event types.
  if(deleting){
   const events=await tx.select({id:activityEvents.id}).from(activityEvents).where(and(
    eq(activityEvents.collegeId,college.id),
    eq(activityEvents.organizationId,college.organizationId),
    eq(activityEvents.subjectType,"announcement"),eq(activityEvents.subjectId,updated.id),
    eq(activityEvents.eventType,"placements.tpo_notice.created"),
   ));
   for(const event of events){
    await tx.delete(inAppNotifications).where(eq(inAppNotifications.eventId,event.id));
   }
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:deleting?"placements.tpo_notice.deleted":"placements.tpo_notice.restored",
   subjectType:"announcement",subjectId:updated.id,
   summary:input.action==="UNDO_SEND"?"TPO notice send undone":deleting?"TPO notice removed":"TPO notice restored",
   metadata:{noticeId:updated.id,version:updated.version},
  });
  return updated;
 });
}
