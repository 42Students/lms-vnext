import "server-only";
import {and,eq,inArray,isNull,sql,desc} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectTasks,projectMembers,collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {listMyProjectInstances} from "./member-service";

export type MentorStudentWatchItem={
  id:string;
  name:string;
  projectId:string;
  projectTitle:string;
  blocked:number;
  waiting:number;
};

/** Student watch reflects current persisted task issues, NOT a guessed
 * behavioral risk score. All rows require an active assigned Mentor project,
 * active college membership, active learner role and active user account. */
export async function getMentorStudentWatch(
  context:RequestContext,
  verifiedRows?:readonly Awaited<ReturnType<typeof listMyProjectInstances>>[number][],
):Promise<MentorStudentWatchItem[]>{
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    context.user.platformStatus!=="ACTIVE"||!can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const assigned=(verifiedRows??await listMyProjectInstances(context))
    .filter(row=>row.memberRole==="MENTOR"&&row.project.collegeId===membership.collegeId);
  const byId=new Map(assigned.map(row=>[row.project.id,row.project.title]));
  if(!byId.size)return [];
  const rows=await getDb().select({
    projectId:projectTasks.projectId,
    memberId:projectMembers.membershipId,
    name:users.displayName,
    blocked:sql<number>`count(*) filter (where ${projectTasks.status} = 'BLOCKED')::int`,
    waiting:sql<number>`count(*) filter (where ${projectTasks.status} = 'IN_REVIEW')::int`,
  }).from(projectTasks)
    .innerJoin(projectMembers,and(
      eq(projectMembers.projectId,projectTasks.projectId),
      eq(projectMembers.membershipId,projectTasks.assigneeMembershipId),
      eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt)))
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,projectMembers.membershipId),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.status,"ACTIVE")))
    .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE")))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      sql`cast(${membershipRoles.role} as text)='LEARNER'`))
    .where(and(inArray(projectTasks.projectId,[...byId.keys()]),
      isNull(projectTasks.deletedAt),inArray(projectTasks.status,["BLOCKED","IN_REVIEW"])))
    .groupBy(projectTasks.projectId,projectMembers.membershipId,users.displayName)
    .orderBy(desc(sql`count(*) filter (where ${projectTasks.status}='BLOCKED')`))
    .limit(30);
  return rows.map(row=>({
    id:row.memberId,name:row.name??"Student",
    projectId:row.projectId,projectTitle:byId.get(row.projectId)??"Project",
    blocked:Number(row.blocked),waiting:Number(row.waiting),
  })).sort((a,b)=>b.blocked-a.blocked||b.waiting-a.waiting||
    a.projectTitle.localeCompare(b.projectTitle)).slice(0,5);
}
