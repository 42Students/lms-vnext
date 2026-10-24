import "server-only";
import {and,eq,gte,lte,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";

export type MentorWeekActivityTotals={
  taskMoves:number;comments:number;resourcesShared:number;count:number;
};

/** The authorized full-week aggregate: never mistake a loaded 100-event page
 * for all work recorded in a large project. No event body/recipient data leaks.
 */
export async function getMentorWeekActivityTotals(
 context:RequestContext,projectId:string,now:Date=new Date(),
):Promise<MentorWeekActivityTotals>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 if(!Number.isFinite(now.getTime()))
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const ist=new Date(now.getTime()+330*60000);
 const mondayOffset=(ist.getUTCDay()+6)%7;
 const from=new Date(Date.UTC(ist.getUTCFullYear(),ist.getUTCMonth(),
   ist.getUTCDate()-mondayOffset)-330*60000);
 const [row]=await getDb().select({
  count:sql<number>`count(*)::int`,
  taskMoves:sql<number>`count(*) filter (where
    ${activityEvents.eventType} = 'projects.task.status_changed' or
    (${activityEvents.eventType} = 'projects.task.details_updated' and
     ${activityEvents.summary} ~* 'task (pulled into sprint|returned to product backlog)')
  )::int`,
  comments:sql<number>`count(*) filter (where
    ${activityEvents.eventType} like 'projects.%' and
    lower(${activityEvents.eventType}) like '%comment%'
  )::int`,
  resourcesShared:sql<number>`count(*) filter (where
    ${activityEvents.eventType} = 'projects.resource.created' or
    (${activityEvents.eventType} = 'projects.resource.updated' and
     ${activityEvents.summary} ~* 'shar(ed|ing)|publish(ed)?')
  )::int`,
 }).from(activityEvents).where(and(
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   gte(activityEvents.occurredAt,from),lte(activityEvents.occurredAt,now),
   or(
     and(or(eq(activityEvents.subjectType,"project"),
            eq(activityEvents.subjectType,"project_instance")),
         eq(activityEvents.subjectId,scope.project.id)),
     sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
     scope.project.legacyProjectId!==null?
       eq(activityEvents.legacyProjectId,scope.project.legacyProjectId):undefined,
   ),
 ));
 return {taskMoves:Number(row?.taskMoves??0),comments:Number(row?.comments??0),
   resourcesShared:Number(row?.resourcesShared??0),count:Number(row?.count??0)};
}
