import "server-only";
import {and,asc,eq,gt,isNull,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,projectTasks,projectSprints,projectReleases,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyProjectMemberships} from "./project-notification-service";
import {planMentorNextSprintAssignments} from "./mentor-next-sprint-assignment-model";
export async function autoAssignProjectTasks(context:RequestContext,projectId:string){
 const scope=await requireProjectLifecycleMutationAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  await assertPersistedProjectMutationActor(tx,context,scope);
  if(!project||!["PLANNED","ACTIVE"].includes(project.status))
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const members=await tx.select({membershipId:projectMembers.membershipId})
   .from(projectMembers).innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER")))
   .where(and(eq(projectMembers.projectId,scope.project.id),eq(projectMembers.role,"LEARNER"),
      isNull(projectMembers.endedAt),eq(collegeMemberships.collegeId,scope.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
  if(!members.length)throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
  const tasks=await tx.select().from(projectTasks)
   .where(and(eq(projectTasks.projectId,scope.project.id),isNull(projectTasks.deletedAt)))
   .for("update");
  const count=new Map(members.map(row=>[row.membershipId,0]));
  for(const task of tasks){
   if(task.assigneeMembershipId&&count.has(task.assigneeMembershipId)&&task.status!=="DONE")
    count.set(task.assigneeMembershipId,count.get(task.assigneeMembershipId)!+1);
  }
  let assigned=0;
  const open=tasks.filter(task=>!task.assigneeMembershipId&&
    ["TODO","IN_PROGRESS","BLOCKED"].includes(task.status))
    .sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id));
  for(const task of open){
   const next=[...count.entries()].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]))[0]!;
   const at=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
   const [updated]=await tx.update(projectTasks).set({
    assigneeMembershipId:next[0],updatedAt:at,
   }).where(and(eq(projectTasks.id,task.id),eq(projectTasks.projectId,scope.project.id),
     isNull(projectTasks.assigneeMembershipId))).returning();
   if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   count.set(next[0],next[1]+1);assigned++;
   const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_task",subjectId:updated.id,subjectLabel:updated.title,
    summary:"Task auto-assigned to learner",
    metadata:{projectId:scope.project.id,assigneeMembershipId:next[0],autoAssigned:true},
    groupKey:"project:"+scope.project.id,
   });
   await notifyProjectMemberships(tx,event.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,membershipIds:[next[0]],
    title:"New task assigned",body:"You have been assigned "+updated.title+".",
    actionHref:"/learn/projects/"+scope.project.id+"?tab=board",
   });
  }
  return {assigned,unassignedRemaining:open.length-assigned};
 });
}

const nextSprintAssignmentInput=z.strictObject({
 sprintId:z.string().uuid(),
 expectedSprintUpdatedAt:z.iso.datetime({offset:true}),
});

/** Target a verified upcoming PLANNED sprint, not every unassigned project task.
 * All assignment choices are recomputed from locked rows. The outcome is
 * auditable and notifies the newly assigned active learner inside the
 * mutation transaction, just as the legacy project-wide route does.
 */
export async function autoAssignMentorNextSprint(
 context:RequestContext,projectId:string,raw:unknown,
){
 const input=nextSprintAssignmentInput.parse(raw);
 const scope=await requireProjectLifecycleMutationAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status})
    .from(projectInstances).where(and(
      eq(projectInstances.id,scope.project.id),
      eq(projectInstances.collegeId,scope.collegeId),
    )).for("update").limit(1);
  await assertPersistedProjectMutationActor(tx,context,scope);
  if(project?.status!=="ACTIVE")
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [target]=await tx.select().from(projectSprints)
    .where(and(eq(projectSprints.id,input.sprintId),
      eq(projectSprints.projectId,scope.project.id),
      isNull(projectSprints.deletedAt))).for("update").limit(1);
  if(!target||target.status!=="PLANNED"||
    target.updatedAt.getTime()!==Date.parse(input.expectedSprintUpdatedAt))
    throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const [active]=await tx.select({sequence:projectSprints.sequence})
    .from(projectSprints).where(and(
      eq(projectSprints.projectId,scope.project.id),
      eq(projectSprints.status,"ACTIVE"),isNull(projectSprints.deletedAt),
    )).limit(1);
  if(active&&target.sequence<=active.sequence)
    throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const [nextPlanned]=await tx.select({id:projectSprints.id})
    .from(projectSprints).where(and(
      eq(projectSprints.projectId,scope.project.id),
      eq(projectSprints.status,"PLANNED"),
      isNull(projectSprints.deletedAt),
      active?gt(projectSprints.sequence,active.sequence):undefined,
    )).orderBy(asc(projectSprints.sequence),asc(projectSprints.id)).limit(1);
  if(!nextPlanned||nextPlanned.id!==target.id)
    throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const [release]=await tx.select({status:projectReleases.status})
    .from(projectReleases).where(and(
      eq(projectReleases.id,target.releaseId),
      eq(projectReleases.projectId,scope.project.id),
      isNull(projectReleases.deletedAt),
    )).limit(1);
  if(!release||release.status==="SHIPPED")
    throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const members=await tx.select({membershipId:projectMembers.membershipId})
    .from(projectMembers)
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    )).where(and(
      eq(projectMembers.projectId,scope.project.id),
      eq(projectMembers.role,"LEARNER"),isNull(projectMembers.endedAt),
      eq(collegeMemberships.collegeId,scope.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
    ));
  if(!members.length)throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
  const tasks=await tx.select().from(projectTasks)
    .where(and(eq(projectTasks.projectId,scope.project.id),
      isNull(projectTasks.deletedAt))).for("update");
  const plan=planMentorNextSprintAssignments(
    tasks,members.map(row=>row.membershipId),target.id);
  for(const item of plan.assignments){
    const source=tasks.find(task=>task.id===item.taskId);
    if(!source||source.assigneeMembershipId!==null||
       source.sprintId!==target.id||
       !["TODO","IN_PROGRESS","BLOCKED"].includes(source.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const at=new Date(Math.max(Date.now(),source.updatedAt.getTime()+1));
    const [updated]=await tx.update(projectTasks).set({
      assigneeMembershipId:item.membershipId,updatedAt:at,
    }).where(and(eq(projectTasks.id,item.taskId),
      eq(projectTasks.projectId,scope.project.id),
      isNull(projectTasks.assigneeMembershipId),
      sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${source.updatedAt.toISOString()}::timestamptz`,
    )).returning();
    if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const event=await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_task",subjectId:updated.id,subjectLabel:updated.title,
      summary:"Next-sprint task auto-assigned",
      metadata:{projectId:scope.project.id,sprintId:target.id,
        assigneeMembershipId:item.membershipId,autoAssigned:true,
        balancingRule:"LOWEST_OPEN_ESTIMATED_POINTS"},
      groupKey:"project:"+scope.project.id,
    });
    await notifyProjectMemberships(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      membershipIds:[item.membershipId],
      title:"Next-sprint task assigned",
      body:"You have been assigned "+updated.title+".",
      actionHref:"/learn/projects/"+scope.project.id+"?tab=board",
    });
  }
  return {sprintId:target.id,assigned:plan.assignments.length,
    assignments:plan.assignments,loadPreview:plan.loads,
    unassignedRemaining:tasks.filter(task=>task.sprintId===target.id&&
      task.assigneeMembershipId===null&&
      ["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)).length-
      plan.assignments.length};
 });
}
