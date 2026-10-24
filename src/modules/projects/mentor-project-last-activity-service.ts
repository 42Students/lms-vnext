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
  const ids=assigned.map(row=>row.project.id);
  const result=new Map<string,Date>();
  if(!ids.length)return result;
  // Action group keys may be project:<id>, project:<id>:meetings,
  // project:<id>:tasks, etc. Resolve the persisted project segment once.
  const groupProjectId=sql<string>`split_part(${activityEvents.groupKey},':',2)`;
  const records=await getDb().select({
    projectId:groupProjectId,
    last:sql<Date>`max(${activityEvents.occurredAt})`,
  }).from(activityEvents).where(and(
    eq(activityEvents.collegeId,member.collegeId),
    inArray(groupProjectId,ids),
    sql`${activityEvents.groupKey} LIKE 'project:%'`,
  )).groupBy(groupProjectId);
  for(const row of records){
    if(!row.projectId||!row.last)continue;
    const date=new Date(row.last);
    if(!Number.isFinite(date.getTime()))continue;
    result.set(row.projectId,date);
  }
  return result;
}
