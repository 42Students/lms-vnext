import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {listActivityEvents} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {getSuperAdminCollegeFeatureSnapshot} from "./admin-college-rule-read";
import {collegePolicyHistoryQuery,safeCollegeRuleHistory} from "./admin-college-rule-history-model";
export async function listCollegeFeatureHistory(context:RequestContext,collegeRaw:string,raw:unknown={}){
 const collegeId=z.uuid().parse(collegeRaw);
 const cursor=collegePolicyHistoryQuery.parse(raw);
 const verified=await getSuperAdminCollegeFeatureSnapshot(context,collegeId);
 if(!verified)return null;
 const rows=await listActivityEvents(context,{
  collegeId,module:"PLATFORM",eventType:ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_MODULE_RULE_CHANGED,
  subjectType:"COLLEGE",subjectId:collegeId,limit:40,
  beforeOccurredAt:cursor.beforeOccurredAt?new Date(cursor.beforeOccurredAt):undefined,beforeId:cursor.beforeId,
 });
 return {college:verified.college,items:safeCollegeRuleHistory(rows.items.map(x=>({
  id:x.event.id,occurredAt:x.event.occurredAt,actorName:x.actor?.displayName??null,metadata:x.event.metadata,
 }))),nextCursor:rows.nextCursor};
}
