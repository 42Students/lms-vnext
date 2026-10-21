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

/** Group the separate per-college notices of ONE broadcast by the immutable
 * activity group key written at publication time. The college metric counts
 * distinct recipient colleges, never individual faculty/TPO bell opens.
 * Per-user notification reads remain available separately.
 */
export async function getSuperAdminBroadcastGroupReceiptCounts(
 context:RequestContext,noticeIds:readonly string[],
) {
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("college.read");
 requirePermission(context,"admin-scope.select");
 const ids=[...new Set(noticeIds)];
 const empty=new Map<string,{
  broadcastGroupKey:string;targetColleges:number;cellRead:number;
  deliveredRecipients:number;readRecipients:number;
 }>();
 if(!ids.length)return empty;
 const db=getDb();
 const scope=[
  eq(activityEvents.subjectType,"announcement"),
  eq(activityEvents.module,"PLATFORM"),
  context.adminScope?.collegeId?eq(activityEvents.collegeId,context.adminScope.collegeId):undefined,
  context.adminScope?.organizationId?eq(activityEvents.organizationId,context.adminScope.organizationId):undefined,
 ];
 const seeds=await db.select({
  noticeId:activityEvents.subjectId,groupKey:activityEvents.groupKey,
 }).from(activityEvents).where(and(...scope,inArray(activityEvents.subjectId,ids)))
  .limit(501);
 const keys=[...new Set(seeds.map(row=>row.groupKey).filter(
  (value):value is string=>typeof value==="string" &&
   value.startsWith("college-broadcast:")))];
 if(!keys.length)return empty;
 const rows=await db.select({
  groupKey:activityEvents.groupKey,
  targetColleges:countDistinct(activityEvents.collegeId),
  cellRead:sql<number>`count(distinct ${placementCellAnnouncementReads.collegeId})::integer`.mapWith(Number),
  deliveredRecipients:countDistinct(inAppNotifications.userId),
  readRecipients:sql<number>`count(distinct ${inAppNotifications.userId}) filter (where ${inAppNotifications.readAt} is not null)::integer`.mapWith(Number),
 }).from(activityEvents)
  .leftJoin(inAppNotifications,eq(inAppNotifications.eventId,activityEvents.id))
  .leftJoin(placementCellAnnouncementReads,
   sql`${placementCellAnnouncementReads.announcementId}::text = ${activityEvents.subjectId}`)
  .where(and(...scope,inArray(activityEvents.groupKey,keys)))
  .groupBy(activityEvents.groupKey);
 const grouped=new Map(rows.filter(row=>row.groupKey!==null).map(row=>[
  row.groupKey!,{
   broadcastGroupKey:row.groupKey!,targetColleges:row.targetColleges,
   cellRead:row.cellRead,deliveredRecipients:row.deliveredRecipients,
   readRecipients:row.readRecipients,
  },
 ]));
 for(const seed of seeds){
  if(!seed.noticeId||!seed.groupKey)continue;
  const receipt=grouped.get(seed.groupKey);
  if(receipt)empty.set(seed.noticeId,receipt);
 }
 return empty;
}
