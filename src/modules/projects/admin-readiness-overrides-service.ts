import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { activityEvents, projectInstances, users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { loadProjectCollegeScope } from "./scope";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {ProjectsServiceError} from "./errors";
import { z } from "zod";

/** Explain the event history without mistaking a CLEAR event for an override.
 * Present cleared rows only in historical/audit views, not the active list.
 */
export function readinessOverrideAuditProjection(input:{
 state:unknown;note:unknown;by:string|null;at:Date;
}){
 const active=input.state==="FORCE_UNLOCK"||input.state==="FORCE_BLOCK";
 return {overrideActive:active,
  overrideValue:input.state==="FORCE_UNLOCK",
  overrideNote:typeof input.note==="string"?input.note:"",
  overrideByName:input.by??"Unknown",overrideAt:input.at};
}
/** COL-projects-12: latest override event per project, not the full audit history. */
export async function listCollegeActiveReadinessOverrides(context: RequestContext, collegeId: string) {
  const requestedCollegeId=z.string().uuid().parse(collegeId);
  if(getProjectAdminCollegeId(context)!==requestedCollegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college=await loadProjectCollegeScope(requestedCollegeId);
  requirePermission(context,"projects.manage",{
    organizationId:college.organizationId,collegeId:college.id,
  });
  // Hold persisted actor authorization through both reads. A committed
  // archive also requires a conflicting lock on the project row; any
  // readiness override emitted here is tied to a still-active workspace.
  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      collegeId:college.id,organizationId:college.organizationId,
    });
    const events=await tx.selectDistinctOn([activityEvents.subjectId],{
      projectId:activityEvents.subjectId,metadata:activityEvents.metadata,
      by:users.displayName,at:activityEvents.occurredAt,
    }).from(activityEvents).leftJoin(users,eq(users.id,activityEvents.actorUserId))
      .where(and(eq(activityEvents.collegeId,college.id),
        eq(activityEvents.subjectType,"project_instance"),
        eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_READINESS_OVERRIDDEN)))
      .orderBy(activityEvents.subjectId,desc(activityEvents.occurredAt),desc(activityEvents.id));
    const live=events.filter(row=>
      (row.metadata.state==="FORCE_UNLOCK"||row.metadata.state==="FORCE_BLOCK") &&
      z.string().uuid().safeParse(row.projectId).success);
    if(!live.length)return [];
    const projects=await tx.select({id:projectInstances.id,title:projectInstances.title,status:projectInstances.status})
      .from(projectInstances).where(and(eq(projectInstances.collegeId,college.id),
        inArray(projectInstances.id,live.map(row=>row.projectId))))
      .for("share");
    const titles=new Map(projects.map(row=>[row.id,row]));
    return live.filter(row=>titles.has(row.projectId)).map(row=>({
      projectId:row.projectId,workspace:titles.get(row.projectId)?.title??"",
      archived:titles.get(row.projectId)?.status==="ARCHIVED",
      ...readinessOverrideAuditProjection({state:row.metadata.state,note:row.metadata.note,by:row.by,at:row.at}),
      direction:row.metadata.state==="FORCE_UNLOCK"?"Ready":"Not ready",
      note:typeof row.metadata.note==="string"?row.metadata.note:"",
      by:row.by??"Unknown",at:row.at,
    }));
  });
}
