import "server-only";
import {and,desc,eq,inArray,lt,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {getSuperAdminCollegeFeatureSnapshot} from "./admin-college-rule-read";
import {collegePolicyHistoryQuery,safeFullModuleHistory} from "./admin-college-rule-history-model";

/** SA-tenants-modules-32: one auditable, tenant-scoped history for college,
 * descendant and learner rules, with a stable 50-row composite cursor. */
const ACCESS_EVENTS=[
 ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_MODULE_RULE_CHANGED,
 ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED,
 "PLATFORM_DESCENDANT_MODULE_RULE_CHANGED",
 "MODULE_ACCESS_BULK_SET",
 "COLLEGE_FEATURE_TOGGLE",
] as const;
export async function listCollegeFeatureHistory(context:RequestContext,collegeRaw:string,raw:unknown={}){
 const collegeId=z.uuid().parse(collegeRaw);
 const cursor=collegePolicyHistoryQuery.parse(raw);
 const verified=await getSuperAdminCollegeFeatureSnapshot(context,collegeId);
 if(!verified)return null;
 requirePermission(context,"activity.read",{collegeId});
 const at=cursor.beforeOccurredAt?new Date(cursor.beforeOccurredAt):null;
 const conditions=and(eq(activityEvents.collegeId,collegeId),
  eq(activityEvents.module,"PLATFORM"),
  inArray(activityEvents.eventType,[...ACCESS_EVENTS]),
  at&&cursor.beforeId?or(lt(activityEvents.occurredAt,at),
    and(eq(activityEvents.occurredAt,at),lt(activityEvents.id,cursor.beforeId))):undefined);
 const rows=await getDb().select({event:activityEvents,actorName:users.displayName})
  .from(activityEvents).leftJoin(users,eq(users.id,activityEvents.actorUserId))
  .where(conditions)
  .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(51);
 const items=rows.slice(0,50);
 const last=items[items.length-1];
 return {college:verified.college,items:safeFullModuleHistory(items.map(x=>({
  id:x.event.id,occurredAt:x.event.occurredAt,actorName:x.actorName,
  metadata:x.event.metadata,eventType:x.event.eventType,
  subjectType:x.event.subjectType,subjectId:x.event.subjectId,
 }))),nextCursor:rows.length>50&&last?{
  beforeOccurredAt:last.event.occurredAt,beforeId:last.event.id,
 }:null};
}
