import "server-only";
import {and,eq,isNull} from "drizzle-orm";
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
