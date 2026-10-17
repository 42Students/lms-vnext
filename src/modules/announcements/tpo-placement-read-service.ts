import "server-only";
import {and,desc,eq,inArray,isNull,isNotNull,or,lte,gt} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10Announcements,placementCellAnnouncementReads} from "@/db/schema/db10-announcements";
import {placementTpoNoticeAudiences} from "@/db/schema/placement-tpo-notice-audiences";
import {users} from "@/db/schema/users";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {senderTypeForTpoTab,tpoAnnouncementTabSchema,projectTpoAnnouncementRows} from "./tpo-placement-read-model";

/** Read only explicitly college-targeted TPO/42 announcements; no learner targeting guesses. */
export async function listTpoPlacementAnnouncements(
 context:RequestContext,rawTab:unknown="yours",now:Date=new Date(),page=1,
){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 const tab=tpoAnnouncementTabSchema.parse(rawTab);
 const targetedReady=await placementTableExists("placement_tpo_notice_audiences");
 const cellReadsReady=tab==="from-42"&&await placementTableExists("placement_cell_announcement_reads");
 const safePage=Number.isFinite(page)?Math.max(1,Math.min(1000,Math.trunc(page))):1;
 if(!await placementTableExists("announcements"))return {status:"NOT_REGISTERED" as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const rows=await tx.select({
   id:db10Announcements.id,title:db10Announcements.title,
   buttonLabel:db10Announcements.buttonLabel,buttonUrl:db10Announcements.buttonUrl,
   message:db10Announcements.message,isPinned:db10Announcements.isPinned,
   version:db10Announcements.version,deletedAt:db10Announcements.deletedAt,
   senderUserId:db10Announcements.senderUserId,
   senderName:users.displayName,updatedAt:db10Announcements.updatedAt,
   createdAt:db10Announcements.createdAt,scheduledAt:db10Announcements.scheduledAt,
   expiresAt:db10Announcements.expiresAt,
  }).from(db10Announcements).leftJoin(users,eq(users.id,db10Announcements.senderUserId)).where(and(
   eq(db10Announcements.organizationId,college.organizationId),
   eq(db10Announcements.collegeId,college.id),
   eq(db10Announcements.receiverType,"COLLEGE"),
   eq(db10Announcements.receiverId,college.id),
   eq(db10Announcements.senderType,senderTypeForTpoTab(tab)),
   ...(tab==="deleted"?
    [isNotNull(db10Announcements.deletedAt),eq(db10Announcements.senderUserId,context.user.id)]:
    [isNull(db10Announcements.deletedAt)]),
   ...(tab==="deleted"||tab==="yours"?[]:[
    or(isNull(db10Announcements.scheduledAt),lte(db10Announcements.scheduledAt,now)),
    or(isNull(db10Announcements.expiresAt),gt(db10Announcements.expiresAt,now)),
   ]),
  )).orderBy(desc(db10Announcements.isPinned),desc(db10Announcements.createdAt),desc(db10Announcements.id))
  .limit(101).offset((safePage-1)*100);
  const visibleRows=rows.slice(0,100);
  const audiences=targetedReady&&visibleRows.length?await tx.select({
   id:placementTpoNoticeAudiences.announcementId,kind:placementTpoNoticeAudiences.kind,
  }).from(placementTpoNoticeAudiences).where(
   inArray(placementTpoNoticeAudiences.announcementId,visibleRows.map(row=>row.id))
  ):[];
  const audienceById=new Map(audiences.map(row=>[row.id,row.kind]));
  const readRows=cellReadsReady&&visibleRows.length?await tx.select({
   id:placementCellAnnouncementReads.announcementId,
   readAt:placementCellAnnouncementReads.firstReadAt,
  }).from(placementCellAnnouncementReads).where(and(
   eq(placementCellAnnouncementReads.collegeId,college.id),
   inArray(placementCellAnnouncementReads.announcementId,visibleRows.map(row=>row.id)),
  )):[];
  const readById=new Map(readRows.map(row=>[row.id,row.readAt]));
  return {status:"READY" as const,items:projectTpoAnnouncementRows(visibleRows).map(row=>({
   ...row,audienceKind:audienceById.get(row.id)??"COLLEGE",
   readAt:cellReadsReady?readById.get(row.id)??null:undefined,
  })),page:safePage,hasMore:rows.length>100,readStateReady:cellReadsReady};
 });
}
