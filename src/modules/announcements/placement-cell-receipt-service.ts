import "server-only";
import {and,eq,isNull,gt,lte,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users} from "@/db/schema";
import {db10Announcements,placementCellAnnouncementReads} from "@/db/schema/db10-announcements";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** One persisted receipt per college, regardless of number of TPO viewers.
 * Authentication is not a substitute for checking persisted active membership. */
export async function markPlacementCellNoticeRead(context:RequestContext,rawId:unknown){
 const id=z.uuid().parse(rawId),member=context.membership;
 if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"TPO")||
   context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.read");
 requirePermission(context,"placements.read",{collegeId:member.collegeId,organizationId:member.organizationId});
 const db=getDb();
 const [valid]=await db.select({id:db10Announcements.id})
  .from(db10Announcements)
  .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,member.id),eq(collegeMemberships.collegeId,member.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(collegeMemberships.userId,context.user.id)))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"TPO")))
  .where(and(eq(db10Announcements.id,id),eq(db10Announcements.collegeId,member.collegeId),
    eq(db10Announcements.receiverId,member.collegeId),eq(db10Announcements.receiverType,"COLLEGE"),
    eq(db10Announcements.senderType,"SUPER_ADMIN"),isNull(db10Announcements.deletedAt),
    or(isNull(db10Announcements.scheduledAt),lte(db10Announcements.scheduledAt,sql`clock_timestamp()`)),
    or(isNull(db10Announcements.expiresAt),gt(db10Announcements.expiresAt,sql`clock_timestamp()`))))
  .limit(1);
 if(!valid)throw new Error("ANNOUNCEMENT_NOT_FOUND");
 const [receipt]=await db.insert(placementCellAnnouncementReads).values({
  announcementId:id,collegeId:member.collegeId,firstReadByUserId:context.user.id,
 }).onConflictDoNothing().returning({announcementId:placementCellAnnouncementReads.announcementId});
 // The earliest reader is stable because the first-in-college receipt uses
 // an ON CONFLICT DO NOTHING key. Later TPO viewers must not replace it.
 const [first]=await db.select({
  firstReadAt:placementCellAnnouncementReads.firstReadAt,
  firstReadByUserId:placementCellAnnouncementReads.firstReadByUserId,
 }).from(placementCellAnnouncementReads).where(and(
  eq(placementCellAnnouncementReads.announcementId,id),
  eq(placementCellAnnouncementReads.collegeId,member.collegeId),
 )).limit(1);
 return {read:true,firstInCollege:Boolean(receipt),
  firstReadAt:first?.firstReadAt??null,
  readScope:"PLACEMENT_CELL" as const,
  currentViewerWasFirstReader:first?.firstReadByUserId===context.user.id,
  // Per-user bell read state is deliberately separate from cell-wide receipt.
  personalBellReceiptRecorded:false as const};
}
