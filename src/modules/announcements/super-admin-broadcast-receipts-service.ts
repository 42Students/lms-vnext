import "server-only";
import {and,countDistinct,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema/activity";
import {placementCellAnnouncementReads} from "@/db/schema/db10-announcements";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

/** Per-notice actual bell-recipient read counts; unlike a delivery job these are
 * not a claim that every college placement cell has read the broadcast. */
export async function getSuperAdminBroadcastReceiptCounts(context:RequestContext,noticeIds:readonly string[]){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("college.read");
 requirePermission(context,"admin-scope.select");
 const ids=[...new Set(noticeIds)];
 if(!ids.length)return new Map<string,{delivered:number;read:number;cellRead:number}>();
 const db=getDb();
 const rows=await db.select({
  announcementId:activityEvents.subjectId,
  collegeId:activityEvents.collegeId,
  organizationId:activityEvents.organizationId,
  delivered:countDistinct(inAppNotifications.userId),
  read:sql<number>`count(distinct ${inAppNotifications.userId}) filter (where ${inAppNotifications.readAt} is not null)::integer`.mapWith(Number),
  cellRead:sql<number>`count(distinct ${placementCellAnnouncementReads.collegeId})::integer`.mapWith(Number),
 }).from(activityEvents)
 .leftJoin(inAppNotifications,eq(inAppNotifications.eventId,activityEvents.id))
 .leftJoin(placementCellAnnouncementReads,sql`${placementCellAnnouncementReads.announcementId}::text = ${activityEvents.subjectId}`)
 .where(and(eq(activityEvents.subjectType,"announcement"),inArray(activityEvents.subjectId,ids),
  eq(activityEvents.module,"PLATFORM"),
  context.adminScope?.collegeId?eq(activityEvents.collegeId,context.adminScope.collegeId):undefined,
  context.adminScope?.organizationId?eq(activityEvents.organizationId,context.adminScope.organizationId):undefined))
 .groupBy(activityEvents.subjectId,activityEvents.collegeId,activityEvents.organizationId);
 return new Map(rows.map(row=>[row.announcementId,{delivered:row.delivered,read:row.read,cellRead:row.cellRead}]));
}
