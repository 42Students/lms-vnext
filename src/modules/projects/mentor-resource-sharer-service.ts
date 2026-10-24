import "server-only";
import {and,asc,eq,inArray,sql} from "drizzle-orm";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {deriveMentorResourceShareProvenance} from "./mentor-resource-share-provenance-model";
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
):Promise<Array<{resourceId:string;userId:string|null;displayName:string|null;sharedAt:string|null}>>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR"||!resourceIds.length)return [];
 const events=await getDb().select({
   resourceId:activityEvents.subjectId,
   eventType:activityEvents.eventType,
   metadata:activityEvents.metadata,
   occurredAt:activityEvents.occurredAt,
   userId:activityEvents.actorUserId,
   actorName:sql<string|null>`coalesce(nullif(${activityEvents.actorNameSnapshot},''),
     ${users.displayName})`,
 }).from(activityEvents)
   .leftJoin(users,eq(users.id,activityEvents.actorUserId))
   .where(and(
     eq(activityEvents.module,"PROJECTS"),
     inArray(activityEvents.eventType,[
       ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_CREATED,
       ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_UPDATED,
       ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_ARCHIVED,
     ]),
     eq(activityEvents.subjectType,"project_resource"),
     eq(activityEvents.collegeId,scope.collegeId),
     eq(activityEvents.organizationId,scope.organizationId),
     eq(activityEvents.groupKey,"project:"+scope.project.id),
     inArray(activityEvents.subjectId,[...resourceIds]),
   )).orderBy(asc(activityEvents.occurredAt),asc(activityEvents.id));
 return deriveMentorResourceShareProvenance(events.map(event=>({
   resourceId:event.resourceId,eventType:event.eventType,
   metadata:event.metadata,occurredAt:event.occurredAt,
   userId:event.userId,displayName:event.actorName,
 })),scope.project.id);
}
