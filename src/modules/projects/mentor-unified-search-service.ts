import "server-only";
import {and,eq,ilike,inArray,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectTasks,projectResources,projectMembers,collegeMemberships,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {ProjectsServiceError} from "./errors";
import {listMyProjectInstances} from "./member-service";
import {sortMentorSearchMatches} from "./mentor-search-ranking-model";

export const mentorUnifiedSearchQuery=z.string().trim().min(1).max(100);
export type MentorSearchResult={key:string;kind:"Project"|"Task"|"Student"|"Resource";
  title:string;context:string;href:string};
const escapeLike=(value:string)=>value.replaceAll("\\","\\\\")
  .replaceAll("%","\\%").replaceAll("_","\\_");

/** Read-only search across the current Mentor's *verified* assigned projects.
 * Search never accepts a project ID or tenant supplied by the browser.
 * Each category is bounded to 15 rows to avoid leaking an entire directory. */
export async function searchMentorWorkspace(context:RequestContext,raw:unknown):
  Promise<MentorSearchResult[]>{
  const term=mentorUnifiedSearchQuery.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
    context.user.platformStatus!=="ACTIVE"||!can(context,"projects.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const projects=(await listMyProjectInstances(context)).filter(row=>
    row.memberRole==="MENTOR"&&row.project.collegeId===membership.collegeId);
  const byId=new Map(projects.map(item=>[item.project.id,item.project.title]));
  if(!byId.size)return [];
  const ids=[...byId.keys()];
  const like="%"+escapeLike(term)+"%";
  const prefix=escapeLike(term)+"%";
  const titleOrder=(column:typeof projectTasks.title)=>
    sql`case when lower(${column})=lower(${term}) then 0
      when lower(${column}) like lower(${prefix}) then 1
      else 2 end`;
  const [tasks,resources,students]=await Promise.all([
    getDb().select({id:projectTasks.id,projectId:projectTasks.projectId,
        title:projectTasks.title,assigneeMembershipId:projectTasks.assigneeMembershipId,
        status:projectTasks.status})
      .from(projectTasks).where(and(inArray(projectTasks.projectId,ids),
        isNull(projectTasks.deletedAt),ilike(projectTasks.title,like)))
      .orderBy(titleOrder(projectTasks.title),projectTasks.title,projectTasks.id).limit(15),
    getDb().select({id:projectResources.id,projectId:projectResources.projectId,
      title:projectResources.title})
      .from(projectResources).where(and(inArray(projectResources.projectId,ids),
        eq(projectResources.status,"ACTIVE"),ilike(projectResources.title,like)))
      .orderBy(sql`case when lower(${projectResources.title})=lower(${term})
        then 0 when lower(${projectResources.title}) like lower(${prefix})
        then 1 else 2 end`,projectResources.title,projectResources.id).limit(15),
    getDb().select({id:collegeMemberships.id,projectId:projectMembers.projectId,
      title:users.displayName})
      .from(projectMembers)
      .innerJoin(collegeMemberships,and(
        eq(collegeMemberships.id,projectMembers.membershipId),
        eq(collegeMemberships.collegeId,membership.collegeId),
        eq(collegeMemberships.status,"ACTIVE")))
      .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
        eq(users.platformStatus,"ACTIVE")))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        sql`cast(${membershipRoles.role} as text)='LEARNER'`))
      .where(and(inArray(projectMembers.projectId,ids),
        eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
        ilike(users.displayName,like)))
      .orderBy(sql`case when lower(${users.displayName})=lower(${term})
        then 0 when lower(${users.displayName}) like lower(${prefix})
        then 1 else 2 end`,users.displayName,collegeMemberships.id).limit(15),
  ]);
  const taskOwnerMembershipIds=[...new Set(tasks.map(task=>
    task.assigneeMembershipId).filter((id):id is string=>id!==null))];
  const activeOwners=taskOwnerMembershipIds.length?await getDb().select({
      id:projectMembers.membershipId,projectId:projectMembers.projectId,
      name:users.displayName,
    }).from(projectMembers)
      .innerJoin(collegeMemberships,and(
        eq(collegeMemberships.id,projectMembers.membershipId),
        eq(collegeMemberships.collegeId,membership.collegeId),
        eq(collegeMemberships.status,"ACTIVE")))
      .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
        eq(users.platformStatus,"ACTIVE")))
      .where(and(
        inArray(projectMembers.projectId,ids),
        inArray(projectMembers.membershipId,taskOwnerMembershipIds),
        eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
      )):[];
  const ownerByTaskScope=new Map(activeOwners.map(owner=>[
    owner.projectId+":"+owner.id,owner.name??"Student",
  ] as const));
  const result:MentorSearchResult[]=[];
  for(const project of projects.filter(item=>
    [item.project.title,item.project.summary??""].some(value=>
      value.toLocaleLowerCase("en-IN").includes(term.toLocaleLowerCase("en-IN")))).slice(0,15))
    result.push({key:"p:"+project.project.id,kind:"Project",
      title:project.project.title,context:project.project.courseLabel??"Mentor project",
      href:"/mentor/projects/"+encodeURIComponent(project.project.id)+"?tab=overview"});
  for(const item of tasks)result.push({key:"t:"+item.id,kind:"Task",
    title:item.title,context:(byId.get(item.projectId)??"Project")+
      " · "+(item.assigneeMembershipId?
        ownerByTaskScope.get(item.projectId+":"+item.assigneeMembershipId)??"Owner unavailable":
        "Unassigned")+" · "+item.status.replaceAll("_"," "),
    href:"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=board&scope=all&task="+encodeURIComponent(item.id)});
  for(const item of students)result.push({key:"s:"+item.projectId+":"+item.id,
    kind:"Student",title:item.title??"Student",
    context:byId.get(item.projectId)??"Project",
    href:"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=performance#mentor-student-"+encodeURIComponent(item.id)});
  for(const item of resources)result.push({key:"r:"+item.id,kind:"Resource",
    title:item.title,context:byId.get(item.projectId)??"Project",
    href:"/mentor/projects/"+encodeURIComponent(item.projectId)+"?tab=resources"});
  return sortMentorSearchMatches(result,term);
}
