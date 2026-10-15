import "server-only";
import {and,desc,eq,isNull,isNotNull,or,lte,gt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements.draft";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {senderTypeForTpoTab,tpoAnnouncementTabSchema,projectTpoAnnouncementRows} from "./tpo-placement-read-model";

/** Read only explicitly college-targeted TPO/42 announcements; no learner targeting guesses. */
export async function listTpoPlacementAnnouncements(
 context:RequestContext,rawTab:unknown="yours",now:Date=new Date(),
){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 const tab=tpoAnnouncementTabSchema.parse(rawTab);
 if(!await placementTableExists("announcements"))return {status:"NOT_REGISTERED" as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const rows=await tx.select({
   id:db10Announcements.id,title:db10Announcements.title,
   message:db10Announcements.message,isPinned:db10Announcements.isPinned,
   version:db10Announcements.version,deletedAt:db10Announcements.deletedAt,
   senderUserId:db10Announcements.senderUserId,
   createdAt:db10Announcements.createdAt,expiresAt:db10Announcements.expiresAt,
  }).from(db10Announcements).where(and(
   eq(db10Announcements.organizationId,college.organizationId),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.receiverType,"COLLEGE"),
   eq(db10Announcements.receiverId,college.id),
   eq(db10Announcements.senderType,senderTypeForTpoTab(tab)),
   ...(tab==="deleted"?
    [isNotNull(db10Announcements.deletedAt),eq(db10Announcements.senderUserId,context.user.id)]:
    [isNull(db10Announcements.deletedAt)]),
   ...(tab==="deleted"?[]:[
    or(isNull(db10Announcements.scheduledAt),lte(db10Announcements.scheduledAt,now)),
    or(isNull(db10Announcements.expiresAt),gt(db10Announcements.expiresAt,now)),
   ]),
  )).orderBy(desc(db10Announcements.isPinned),desc(db10Announcements.createdAt))
  .limit(100);
  return {status:"READY" as const,items:projectTpoAnnouncementRows(rows)};
 });
}
