import "server-only";
import {and,eq,inArray,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";

/** Last persisted project action *authored by* each active roster user.
 * This is NOT online presence, login time, or the last task assigned to them.
 * Query scope is the authenticated project and college, never a global audit.
 */
export async function getMentorTeamRecentActorActivity(
 context:RequestContext,projectId:string,
 roster:readonly {userId:string}[],
):Promise<Record<string,string>>{
 const scope=await requireProjectReadAccess(context,projectId);
 if(scope.access!=="MENTOR")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const users=[...new Set(roster.map(row=>row.userId).filter(Boolean))];
 if(!users.length)return {};
 const rows=await getDb().select({
   actorId:activityEvents.actorUserId,
   lastAt:sql<Date|string|null>`max(${activityEvents.occurredAt})`,
 }).from(activityEvents).where(and(
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   inArray(activityEvents.actorUserId,users),
   or(
     and(or(eq(activityEvents.subjectType,"project"),
            eq(activityEvents.subjectType,"project_instance")),
         eq(activityEvents.subjectId,scope.project.id)),
     sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
     scope.project.legacyProjectId!==null?
       eq(activityEvents.legacyProjectId,scope.project.legacyProjectId):undefined,
   ),
 )).groupBy(activityEvents.actorUserId);
 return Object.fromEntries(rows.flatMap(row=>{
   const instant=row.lastAt instanceof Date?row.lastAt:
     typeof row.lastAt==="string"?new Date(row.lastAt):null;
   return row.actorId&&instant&&Number.isFinite(instant.getTime())?
     [[row.actorId,instant.toISOString()]]:[];
 }));
}
