import "server-only";
import {and,asc,eq,inArray,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,projectInstances,projectTaskComments,projectTasks,projectMembers,collegeMemberships,users} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {projectTaskCommentInputSchema,PROJECT_TASK_ACTIVITY_EVENT_KINDS} from "./pr-s2-04-task-fields-model";
import {projectTaskIdSchema} from "./validation";
import {notifyActiveProjectMembers} from "./project-notification-service";

export async function listProjectTaskComments(context:RequestContext,projectId:string,taskIdInput:string){
 const scope=await requireProjectReadAccess(context,projectId);
 const taskId=projectTaskIdSchema.parse(taskIdInput);
 const [task]=await getDb().select({id:projectTasks.id}).from(projectTasks)
  .where(and(eq(projectTasks.projectId,scope.project.id),eq(projectTasks.id,taskId))).limit(1);
 if(!task)throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
 const comments=await getDb().select({
   id:projectTaskComments.id,
   // Legacy nullable bodies were normalized during import; preserve their
   // historical absence as a display-only null without accepting new nulls.
   body:sql<string>`case when ${projectTaskComments.legacyBodyWasNull} is true
     then '' else ${projectTaskComments.body} end`,
   commentKind:projectTaskComments.commentKind,
   authorMembershipId:projectTaskComments.authorMembershipId,
   createdAt:projectTaskComments.createdAt,
   // Prefer the immutable actor display captured when this particular comment
   // was posted. User profile name changes must not rewrite historical notes.
   authorName:sql<string|null>`coalesce(
     nullif(${projectTaskComments.legacyCommenterName},''),
     (select nullif(ae.metadata ->> 'authorDisplayName','')
        from activity_events ae
       where ae.college_id=${scope.collegeId}
         and ae.subject_type='project_task'
         and ae.subject_id=${taskId}
         and ae.event_type=${ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED}
         and ae.metadata ->> 'projectId'=${scope.project.id}
         and ae.metadata ->> 'commentId'=${projectTaskComments.id}::text
       order by ae.occurred_at desc,ae.id desc limit 1),
     nullif(${users.displayName},''),'Former project member'
   )`,
   authorRole:sql<string|null>`coalesce(
     ${projectTaskComments.legacyCommenterType},
     (select ae.metadata ->> 'authorRole'
        from activity_events ae
       where ae.college_id=${scope.collegeId}
         and ae.subject_type='project_task'
         and ae.subject_id=${taskId}
         and ae.event_type=${ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED}
         and ae.metadata ->> 'commentId'=${projectTaskComments.id}::text
       order by ae.occurred_at desc, ae.id desc limit 1)
   )`,
   taskStatusSnapshot:projectTaskComments.taskStatusSnapshot,
   progressValue:projectTaskComments.progressValue,
 }).from(projectTaskComments)
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectTaskComments.authorMembershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(
   eq(projectTaskComments.projectId,scope.project.id),eq(projectTaskComments.taskId,taskId),
   eq(collegeMemberships.collegeId,scope.collegeId),
   isNull(projectTaskComments.deletedAt),
   sql`${projectTaskComments.legacyWasDeleted} is distinct from true`,
 )).orderBy(asc(projectTaskComments.createdAt),asc(projectTaskComments.id));
 // Task mutations already persist PROJECTS activity events in the same DB
 // transaction. Join that immutable stream at read time: this preserves
 // status/review/submission history without accepting spoofed system comments
 // from the human POST endpoint or duplicating audit rows on retries.
 const events=await getDb().select({
  id:activityEvents.id,eventType:activityEvents.eventType,
  summary:activityEvents.summary,metadata:activityEvents.metadata,
  actorMembershipId:activityEvents.actorMembershipId,
  actorNameSnapshot:activityEvents.actorNameSnapshot,
  actorRoleSnapshot:activityEvents.actorRoleSnapshot,
  createdAt:activityEvents.occurredAt,
 }).from(activityEvents).where(and(
  eq(activityEvents.collegeId,scope.collegeId),
  eq(activityEvents.module,"PROJECTS"),
  eq(activityEvents.subjectType,"project_task"),
  eq(activityEvents.subjectId,taskId),
  inArray(activityEvents.eventType,[...PROJECT_TASK_ACTIVITY_EVENT_KINDS]),
  sql`${activityEvents.metadata} ->> 'projectId' = ${scope.project.id}`,
 )).orderBy(asc(activityEvents.occurredAt),asc(activityEvents.id));
 const systemComments=events.map(event=>{
  const nextStatus=typeof event.metadata["nextStatus"]==="string"
    ?event.metadata["nextStatus"]:null;
  const oldStatus=typeof event.metadata["previousStatus"]==="string"
    ?event.metadata["previousStatus"]:null;
  const progress=event.metadata["progressValue"];
  const progressValue=typeof progress==="number"&&Number.isInteger(progress)
    &&progress>=0&&progress<=100?progress:null;
  const commentKind=event.eventType===ACTIVITY_EVENT_TYPES.PROJECTS_TASK_REVIEWED
    ?"REVIEW":event.eventType===ACTIVITY_EVENT_TYPES.PROJECTS_TASK_STATUS_CHANGED
    &&nextStatus==="BLOCKED"?"BLOCKED":"STATUS_UPDATE";
  return {
   id:event.id,body:oldStatus&&nextStatus
    ?oldStatus.replaceAll("_"," ")+" → "+nextStatus.replaceAll("_"," ")
    :event.summary,
   commentKind,authorMembershipId:event.actorMembershipId??"",
   authorName:event.actorNameSnapshot??"Project team",
   authorRole:event.actorRoleSnapshot??null,createdAt:event.createdAt,
   taskStatusSnapshot:nextStatus,progressValue,
  };
 });
 return [...comments,...systemComments].sort((a,b)=>
  a.createdAt.getTime()-b.createdAt.getTime()||a.id.localeCompare(b.id));
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
  const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project||project.deletedAt||project.status==="ARCHIVED"||project.status==="COMPLETED")
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [task]=await tx.select().from(projectTasks).where(and(
    eq(projectTasks.projectId,scope.project.id),eq(projectTasks.id,taskId),
    isNull(projectTasks.deletedAt),
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
   progressValue:input.progressValue??null,
   taskStatusSnapshot:task.status,
  }).returning();
  if(!comment)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [author]=await tx.select({displayName:users.displayName})
   .from(users).where(eq(users.id,persisted.user.id)).limit(1);
  const event = await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_task",subjectId:taskId,subjectLabel:task.title,
    summary:"Project task comment added",metadata:{projectId:scope.project.id,taskId,commentId:comment.id,
      commentKind:comment.commentKind,progressValue:comment.progressValue,
      taskStatusAtComment:task.status,
      authorMembershipId,authorDisplayName:author?.displayName??null,
      authorRole:scope.member?.role??"ADMIN",
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
