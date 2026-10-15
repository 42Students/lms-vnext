import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements.draft";
import {activityEvents} from "@/db/schema/activity";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";

export const tpoNoticeCreateSchema=z.object({
 title:z.string().trim().min(1).max(255),
 message:z.string().trim().min(1).max(10000),
 pinned:z.boolean().default(false),
}).strict();

export async function createTpoNotice(context:RequestContext,raw:unknown){
 const data=tpoNoticeCreateSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("announcements"))throw new Error("ANNOUNCEMENTS_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [notice]=await tx.insert(db10Announcements).values({
   organizationId:college.organizationId,collegeId:college.id,
   receiverType:"COLLEGE",receiverId:college.id,senderUserId:context.user.id,
   senderType:"TPO",title:data.title,message:data.message,isPinned:data.pinned,
  }).returning({id:db10Announcements.id,version:db10Announcements.version});
  if(!notice)throw new Error("NOTICE_CREATE_FAILED");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"placements.tpo_notice.created",
   subjectType:"announcement",subjectId:notice.id,
   summary:"TPO college-wide notice created",
   metadata:{noticeId:notice.id,pinned:data.pinned},
  });
  return notice;
 });
}
