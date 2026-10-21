import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectTasks,projectTaskSubmissions,projectTaskComments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyProjectMemberships} from "./project-notification-service";
const schema=z.strictObject({expectedUpdatedAt:z.iso.datetime({offset:true}),confirm:z.literal(true)});
export async function deleteMentorProjectTask(context:RequestContext,projectIdRaw:string,taskIdRaw:string,raw:unknown){
 const projectId=z.string().uuid().parse(projectIdRaw),taskId=z.string().uuid().parse(taskIdRaw);
 const input=schema.parse(raw),scope=await requireProjectLifecycleMutationAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project||!["PLANNED","ACTIVE"].includes(project.status))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await assertPersistedProjectMutationActor(tx,context,scope);
  const [task]=await tx.select().from(projectTasks)
    .where(and(eq(projectTasks.id,taskId),eq(projectTasks.projectId,scope.project.id),
      isNull(projectTasks.deletedAt)))
    .for("update").limit(1);
  if(!task||task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [submission]=await tx.select({id:projectTaskSubmissions.id}).from(projectTaskSubmissions)
    .where(and(eq(projectTaskSubmissions.projectId,scope.project.id),
      eq(projectTaskSubmissions.taskId,task.id))).limit(1);
  if(submission||task.status==="DONE"||task.status==="IN_REVIEW")
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  // Preserve discussion, suppression key and all task history for later audit.
  // Never hard-delete a materialized template task: it would reappear when
  // old template snapshots are reconciled and could destroy comment FKs.
  const comments=await tx.select({id:projectTaskComments.id}).from(projectTaskComments)
    .where(and(eq(projectTaskComments.projectId,scope.project.id),
      eq(projectTaskComments.taskId,task.id)));
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
    summary:"Mentor removed task from project board",
    metadata:{projectId:scope.project.id,taskId:task.id,deleted:true,
      deletionSource:"WORKSPACE",deletedByWorkspace:true,
      templateKey:task.templateKey,
      commentCount:comments.length,formerAssigneeMembershipId:task.assigneeMembershipId},
    groupKey:"project:"+scope.project.id,
  });
  if(task.assigneeMembershipId)await notifyProjectMemberships(tx,event.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,membershipIds:[task.assigneeMembershipId],
    title:"Task removed",body:task.title+" was removed from your project.",
    actionHref:"/learn/projects/"+scope.project.id+"?tab=board",
  });
  const now=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
  const [deleted]=await tx.update(projectTasks)
   .set({deletedAt:now,deletedByWorkspace:true,updatedAt:now})
   .where(and(eq(projectTasks.id,task.id),
     eq(projectTasks.projectId,scope.project.id),isNull(projectTasks.deletedAt)))
   .returning({id:projectTasks.id});
  if(!deleted)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  return {deleted:true,tombstoned:true,deletedByWorkspace:true,templateKey:task.templateKey,commentCount:comments.length};
 });
}
