import "server-only";
import {and,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {listMyProjectInstances} from "./member-service";

/** Reads a real last activity event, not project_instances.updated_at.
 * Uses only verified currently assigned Mentor projects and their project
 * and meeting group keys, with college isolation at the database boundary. */
export async function getMentorProjectLastActivity(
  context:RequestContext,
):Promise<Map<string,Date>>{
  const member=context.membership;
  if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    context.user.platformStatus!=="ACTIVE"||
    !can(context,"projects.read",{
      collegeId:member.collegeId,organizationId:member.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const assigned=(await listMyProjectInstances(context)).filter(row=>
    row.memberRole==="MENTOR"&&row.project.collegeId===member.collegeId);
  const keys=assigned.flatMap(row=>[
    "project:"+row.project.id,
    "project:"+row.project.id+":meetings",
  ]);
  const result=new Map<string,Date>();
  if(!keys.length)return result;
  const records=await getDb().select({
    group:activityEvents.groupKey,
    last:sql<Date>`max(${activityEvents.occurredAt})`,
  }).from(activityEvents).where(and(
    eq(activityEvents.collegeId,member.collegeId),
    inArray(activityEvents.groupKey,keys),
  )).groupBy(activityEvents.groupKey);
  const allowed=new Set(assigned.map(row=>row.project.id));
  for(const row of records){
    if(!row.group||!row.last)continue;
    const id=row.group.split(":")[1];
    if(!id||!allowed.has(id))continue;
    const date=new Date(row.last);
    if(!Number.isFinite(date.getTime()))continue;
    if(date.getTime()>(result.get(id)?.getTime()??0))result.set(id,date);
  }
  return result;
}
