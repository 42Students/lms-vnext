import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {listActivityEvents} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {getSuperAdminLearnerAccessTrace} from "./admin-trace-service";
import {safeStudentRuleHistory} from "./admin-student-rule-history-model";
export async function listSuperAdminStudentRuleHistory(context:RequestContext,collegeInput:string,memberInput:string){
 const collegeId=z.uuid().parse(collegeInput);
 const membershipId=z.uuid().parse(memberInput);
 const verified=await getSuperAdminLearnerAccessTrace(context,collegeId,{membershipId});
 if(!verified?.selected)return null;
 const events=await listActivityEvents(context,{
  collegeId,module:"PLATFORM",eventType:ACTIVITY_EVENT_TYPES.PLATFORM_STUDENT_MODULE_RULE_CHANGED,
  subjectType:"MEMBERSHIP",subjectId:membershipId,limit:40
 });
 return {college:verified.college,learnerName:verified.selected.displayName,
  items:safeStudentRuleHistory(events.items.map(row=>({
   id:row.event.id,occurredAt:row.event.occurredAt,summary:row.event.summary,
   actorName:row.actor?.displayName??null,metadata:row.event.metadata,
  }))),hasOlder:Boolean(events.nextCursor)};
}
