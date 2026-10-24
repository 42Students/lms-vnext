import "server-only";
import {and,count,desc,eq,gte,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,projectInstances} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {notifyActiveProjectMembers,projectNoticeHref}
  from "./project-notification-service";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {requireProjectLifecycleMutationAccess} from "./access";
import {ProjectsServiceError} from "./errors";

export const mentorProjectUpdateSchema=z.object({
  message:z.string().trim().min(1).max(1000),
}).strict();

export const mentorUpdateThrottlePolicy={
  maxPerMinute:3,maxPerHour:20,duplicateWindowMs:30_000,
} as const;

/** Strictly persisted updates and recipient notifications: either both commit
 * or neither does. The project row lock serializes status changes while an
 * actor/project advisory lock serializes concurrent posts and quota decisions.
 */
export async function postMentorProjectUpdate(
 context:RequestContext,projectId:string,raw:unknown,
){
 const {message}=mentorProjectUpdateSchema.parse(raw);
 const access=await requireProjectLifecycleMutationAccess(context,projectId);
 if(access.access!=="MENTOR"||access.project.status!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
   // Never trust the status read before an archived/complete transition.
   const [project]=await tx.select({
     id:projectInstances.id,status:projectInstances.status,
   }).from(projectInstances).where(and(
     eq(projectInstances.id,access.project.id),
     eq(projectInstances.collegeId,access.collegeId),
     isNull(projectInstances.deletedAt),
   )).for("update").limit(1);
   if(project?.status!=="ACTIVE")
     throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
   // Project members can be revoked while a post waits for the project lock.
   await assertPersistedProjectMutationActor(tx,context,access);

   await tx.execute(sql`select pg_advisory_xact_lock(
     hashtextextended(${access.project.id+"|"+context.user.id}, 47))`);
   const now=new Date(),hourAgo=new Date(now.getTime()-3_600_000);
   const [recent]=await tx.select({
     total:count(),
     inMinute:sql<number>`count(*) filter (where
       ${activityEvents.occurredAt} >= ${new Date(now.getTime()-60_000)})::int`,
   }).from(activityEvents).where(and(
     eq(activityEvents.module,"PROJECTS"),
     eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_UPDATE_POSTED),
     eq(activityEvents.actorUserId,context.user.id),
     eq(activityEvents.collegeId,access.collegeId),
     eq(activityEvents.organizationId,access.organizationId),
     eq(activityEvents.subjectType,"project"),
     eq(activityEvents.subjectId,access.project.id),
     gte(activityEvents.occurredAt,hourAgo),
   ));
   const [last]=await tx.select({
     id:activityEvents.id,summary:activityEvents.summary,
     occurredAt:activityEvents.occurredAt,
   }).from(activityEvents).where(and(
     eq(activityEvents.module,"PROJECTS"),
     eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_UPDATE_POSTED),
     eq(activityEvents.actorUserId,context.user.id),
     eq(activityEvents.collegeId,access.collegeId),
     eq(activityEvents.subjectType,"project"),
     eq(activityEvents.subjectId,access.project.id),
   )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
   // A double-click or retry of the exact same content is idempotent.
   if(last&&last.summary===message&&
      now.getTime()-last.occurredAt.getTime()<mentorUpdateThrottlePolicy.duplicateWindowMs)
     return last;
   if((recent?.inMinute??0)>=mentorUpdateThrottlePolicy.maxPerMinute||
      (recent?.total??0)>=mentorUpdateThrottlePolicy.maxPerHour)
     throw new ProjectsServiceError("PROJECT_UPDATE_RATE_LIMITED");

   const event=await recordActivityEventInTransaction(tx,context,{
     eventType:ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_UPDATE_POSTED,
     collegeId:access.collegeId,
     organizationId:access.organizationId,
     subjectType:"project",subjectId:access.project.id,
     subjectLabel:access.project.title,summary:message,
     metadata:{projectId:access.project.id,sourceTab:"activity",kind:"mentor_update"},
   });
   // Notification receipts are scoped to each role's real portal destination.
   // Failure to deliver rolls back the authored event; no false "team informed".
   for(const role of ["LEARNER","MENTOR"] as const){
     await notifyActiveProjectMembers(tx,event.id,{
       projectId:access.project.id,collegeId:access.collegeId,
       roles:[role],exceptUserId:context.user.id,
       title:"Project update",body:message.slice(0,240),
       actionHref:projectNoticeHref(role,access.project.id)+"?tab=activity",
     });
   }
   return event;
 });
}
