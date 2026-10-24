import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";

/** Creator provenance is sourced from append-only resource creation events.
 * A legacy resource without such an event is UNKNOWN, never attributed to
 * the current Mentor or team lead. Author IDs are only used for filtering.
 */
export async function getMentorResourceSharers(
 context:RequestContext,projectId:string,resourceIds:readonly string[],
):Promise<Array<{resourceId:string;userId:string|null;displayName:string|null}>>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR"||!resourceIds.length)return [];
 const events=await getDb().select({
   resourceId:activityEvents.subjectId,
   userId:activityEvents.actorUserId,
   actorName:sql<string|null>`coalesce(nullif(${activityEvents.actorNameSnapshot},''),
     ${users.displayName})`,
 }).from(activityEvents)
   .leftJoin(users,eq(users.id,activityEvents.actorUserId))
   .where(and(
     eq(activityEvents.module,"PROJECTS"),
     eq(activityEvents.eventType,"projects.resource.created"),
     eq(activityEvents.subjectType,"project_resource"),
     eq(activityEvents.collegeId,scope.collegeId),
     eq(activityEvents.organizationId,scope.organizationId),
     eq(activityEvents.groupKey,"project:"+scope.project.id),
     inArray(activityEvents.subjectId,[...resourceIds]),
   )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id));
 const seen=new Set<string>();
 return events.flatMap(row=>{
   if(seen.has(row.resourceId))return [];
   seen.add(row.resourceId);
   return [{resourceId:row.resourceId,userId:row.userId,
     displayName:row.actorName}];
 });
}
