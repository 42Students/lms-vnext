import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {mentorBlockerAge} from "./mentor-blocker-age-model";

/** Block durations are read only from tenant-scoped status transition events.
 * Missing legacy transitions are returned as null, not estimated from
 * unrelated task updates. The caller supplies only currently blocked task IDs
 * already observed in the authorized project workspace.
 */
export async function listMentorBlockedTaskAges(
 context:RequestContext,projectId:string,blockedTaskIds:readonly string[],
 now:Date=new Date(),
):Promise<Record<string,{sinceIso:string|null;days:number|null}>>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR"||blockedTaskIds.length===0)return {};
 const ids=[...new Set(blockedTaskIds)].slice(0,1000);
 const rows=await getDb().select({
  taskId:activityEvents.subjectId,occurredAt:activityEvents.occurredAt,
 }).from(activityEvents).where(and(
  eq(activityEvents.module,"PROJECTS"),
  eq(activityEvents.eventType,"projects.task.status_changed"),
  eq(activityEvents.collegeId,scope.collegeId),
  eq(activityEvents.organizationId,scope.organizationId),
  eq(activityEvents.groupKey,"project:"+scope.project.id),
  eq(activityEvents.subjectType,"project_task"),
  inArray(activityEvents.subjectId,ids),
  sql`${activityEvents.metadata} ->> 'nextStatus' = 'BLOCKED'`,
 )).orderBy(desc(activityEvents.occurredAt)).limit(10000);
 const evidence=rows.map(row=>({taskId:row.taskId,occurredAt:row.occurredAt}));
 return Object.fromEntries(ids.map(id=>{
  const age=mentorBlockerAge(id,evidence,now);
  return [id,{sinceIso:age.sinceIso,days:age.days}];
 }));
}
