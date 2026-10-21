import "server-only";
import {and,desc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {requireProjectLifecycleAccess} from "./access";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";

export class ProjectResourceHistoryUnavailable extends Error{
 constructor(){super("RESOURCE_AUDIT_UNAVAILABLE");this.name="ProjectResourceHistoryUnavailable";}
}

/** Authorized, college-scoped immutable resource events. Live resources and
 * history are distinct reads; a Super Admin must have selected the same
 * college as the workspace, and all other roles use existing lifecycle scope.
 * 201 rows signal more history, never imply a truncated list is complete. */
export async function getProjectResourceHistory(context:RequestContext,projectId:string){
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const scope=await requireProjectLifecycleAccess(context,projectId);
 if(isSuperAdmin(context) && context.adminScope?.collegeId!==scope.collegeId)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 try{
  const entries=await getDb().select({
   id:activityEvents.id,resourceId:activityEvents.subjectId,
   summary:activityEvents.summary,eventType:activityEvents.eventType,
   occurredAt:activityEvents.occurredAt,
   actorUserId:activityEvents.actorUserId,
   actorRoleSnapshot:activityEvents.actorRoleSnapshot,
  }).from(activityEvents).where(and(
   eq(activityEvents.collegeId,scope.collegeId),
   eq(activityEvents.organizationId,scope.organizationId),
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.subjectType,"project_resource"),
   eq(activityEvents.groupKey,"project:"+scope.project.id),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(201);
  return {rows:entries.slice(0,200).map(row=>({
   ...row,occurredAt:row.occurredAt.toISOString(),
  })),hasMore:entries.length>200};
 }catch{
  throw new ProjectResourceHistoryUnavailable();
 }
}
