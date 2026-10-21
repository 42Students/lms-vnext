import "server-only";
import {and,asc,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectTaskComments,projectTasks,projectMembers,collegeMemberships,users} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {projectTaskCommentInputSchema} from "./pr-s2-04-task-fields-model";
import {projectTaskIdSchema} from "./validation";
import {notifyActiveProjectMembers} from "./project-notification-service";

export async function listProjectTaskComments(context:RequestContext,projectId:string,taskIdInput:string){
 const scope=await requireProjectReadAccess(context,projectId);
 const taskId=projectTaskIdSchema.parse(taskIdInput);
 const [task]=await getDb().select({id:projectTasks.id}).from(projectTasks)
  .where(and(eq(projectTasks.projectId,scope.project.id),eq(projectTasks.id,taskId))).limit(1);
 if(!task)throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
 return getDb().select({
   id:projectTaskComments.id,body:projectTaskComments.body,
   commentKind:projectTaskComments.commentKind,
   authorMembershipId:projectTaskComments.authorMembershipId,
   createdAt:projectTaskComments.createdAt,authorName:users.displayName,
   taskStatusSnapshot:projectTaskComments.taskStatusSnapshot,
   progressValue:projectTaskComments.progressValue,
 }).from(projectTaskComments)
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectTaskComments.authorMembershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(
   eq(projectTaskComments.projectId,scope.project.id),eq(projectTaskComments.taskId,taskId),
   eq(collegeMemberships.collegeId,scope.collegeId),
 )).orderBy(asc(projectTaskComments.createdAt),asc(projectTaskComments.id));
}
export async function postProjectTaskComment(context:RequestContext,projectId:string,taskIdInput:string,raw:unknown){
 const scope=await requireProjectReadAccess(context,projectId);
 // Observer is a read-only editor role, but an active project participant may
 // still leave a historical comment (legacy behaviour). Mutating task fields
 // continues to use the stricter role/canMutate permission checks.
 if(!context.membership||context.membership.collegeId!==scope.collegeId)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const taskId=projectTaskIdSchema.parse(taskIdInput);
 const input=projectTaskCommentInputSchema.parse(raw);
 const authorMembershipId=context.membership.id;
 return getDb().transaction(async tx=>{
  const persisted=await assertPersistedPlatformPermission(tx,context,
    scope.access==="ADMIN"?"projects.manage":"projects.read",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    });
  if(persisted.membership?.id!==authorMembershipId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(scope.access!=="ADMIN"){
    const [activeMember]=await tx.select({id:projectMembers.id})
     .from(projectMembers).where(and(
       eq(projectMembers.projectId,scope.project.id),
       eq(projectMembers.membershipId,authorMembershipId),
       isNull(projectMembers.endedAt),
     )).for("share").limit(1);
    if(!activeMember)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project||project.status==="ARCHIVED"||project.status==="COMPLETED")
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [task]=await tx.select().from(projectTasks).where(and(
    eq(projectTasks.projectId,scope.project.id),eq(projectTasks.id,taskId),
  )).for("update").limit(1);
  if(!task)throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
  if(task.updatedAt.getTime()!==Date.parse(input.expectedTaskUpdatedAt))
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [updated]=await tx.update(projectTasks)
    .set({updatedAt:new Date(Math.max(Date.now(),task.updatedAt.getTime()+1))})
    .where(and(eq(projectTasks.id,taskId),eq(projectTasks.projectId,scope.project.id),
     sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedTaskUpdatedAt).toISOString()}::timestamptz`))
    .returning({id:projectTasks.id,updatedAt:projectTasks.updatedAt});
  if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [comment]=await tx.insert(projectTaskComments).values({
   projectId:scope.project.id,taskId,authorMembershipId,body:input.body,
   commentKind:input.commentKind,
   taskStatusSnapshot:task.status,
  }).returning();
  if(!comment)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const event = await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_task",subjectId:taskId,subjectLabel:task.title,
    summary:"Project task comment added",metadata:{projectId:scope.project.id,taskId,commentId:comment.id,
      commentKind:comment.commentKind,taskStatusAtComment:task.status,
      authorMembershipId,authorDisplayName:persisted.user.displayName,
      taskUpdatedAtAtComment:task.updatedAt.toISOString()},
    groupKey:"project:"+scope.project.id,
  });
  for (const recipient of ["LEARNER","MENTOR"] as const) {
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:[recipient],
      exceptUserId:context.user.id,
      title:input.commentKind==="FLAG_FOR_MENTOR"&&recipient==="MENTOR"
        ?"Flag for mentor: "+task.title:"New comment on "+task.title,
      body:input.commentKind==="FLAG_FOR_MENTOR"
        ?"A project task needs mentor attention.":"A team member commented on a project task.",
      actionHref:recipient==="MENTOR" ? "/mentor/projects/"+scope.project.id+"?tab=board"
        : "/learn/projects/"+scope.project.id+"?tab=board",
    });
  }
  return {...comment,updatedTaskAt:updated.updatedAt};
 });
}
