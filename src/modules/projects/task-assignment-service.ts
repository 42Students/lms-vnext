import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,projectTasks,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {requireProjectLifecycleMutationAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {z} from "zod";
import {notifyProjectMemberships} from "./project-notification-service";

export const assignProjectTaskInputSchema=z.object({
  assigneeMembershipId:z.string().uuid().nullable(),
  expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();

/** PR-S2-03: explicitly assign tasks only to a currently active learner on the same project. */
export async function assignProjectTask(context:RequestContext,projectIdInput:string,taskIdInput:string,rawInput:unknown){
  const input=assignProjectTaskInputSchema.parse(rawInput);
  const taskId=z.string().uuid().parse(taskIdInput);
  const scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if(!project||!["PLANNED","ACTIVE"].includes(project.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [task]=await tx.select().from(projectTasks)
      .where(and(eq(projectTasks.id,taskId),eq(projectTasks.projectId,scope.project.id),
        isNull(projectTasks.deletedAt)))
      .for("update").limit(1);
    if(!task)throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if(task.status==="DONE"||task.status==="IN_REVIEW"||
      task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    if(task.assigneeMembershipId===input.assigneeMembershipId)return task;
    if(input.assigneeMembershipId){
      const [eligible]=await tx.select({id:projectMembers.id}).from(projectMembers)
        .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
        .where(and(eq(projectMembers.projectId,scope.project.id),
          eq(projectMembers.membershipId,input.assigneeMembershipId),eq(projectMembers.role,"LEARNER"),
          isNull(projectMembers.endedAt),eq(collegeMemberships.collegeId,scope.collegeId),
          eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
      if(!eligible)throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
    }
    const now=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
    const [updated]=await tx.update(projectTasks).set({assigneeMembershipId:input.assigneeMembershipId,updatedAt:now})
      .where(and(eq(projectTasks.id,task.id),eq(projectTasks.projectId,scope.project.id),
        isNull(projectTasks.deletedAt),
        sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`)).returning();
    if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const event = await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_task",subjectId:updated.id,subjectLabel:updated.title,
      summary:"Task assignment updated",
      metadata:{projectId:scope.project.id,assigneeMembershipId:updated.assigneeMembershipId},
      groupKey:"project:"+scope.project.id,
    });
    if(updated.assigneeMembershipId&&updated.assigneeMembershipId!==task.assigneeMembershipId){
      await notifyProjectMemberships(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        membershipIds:[updated.assigneeMembershipId],
        title:"New task assigned",body:"You have been assigned "+updated.title+".",
        actionHref:"/learn/projects/"+scope.project.id,
      });
    }
    if(task.assigneeMembershipId&&task.assigneeMembershipId!==updated.assigneeMembershipId){
      await notifyProjectMemberships(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        membershipIds:[task.assigneeMembershipId],
        title:"Task removed",body:"You are no longer assigned to "+updated.title+".",
        actionHref:"/learn/projects/"+scope.project.id,
      });
    }
    return updated;
  });
}
