import "server-only";
import {nextProjectSequence} from "./project-sequence-allocation";
import {randomUUID} from "node:crypto";
import {and,desc,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectSprints,projectReleases,projectTasks,projectTaskComments,projectTaskSubmissions} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {assertPersistedLearnerProjectMutation} from "./learner-mutation-guard";
import {learnerOwnTaskCreateInputSchema} from "./learner-own-task-input-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyActiveProjectMembers} from "./project-notification-service";

const params=z.strictObject({projectId:z.string().uuid()});
function keyFor(membershipId:string){return "learner-"+membershipId.replaceAll("-","")+"-"+randomUUID().slice(0,8);}
export async function createLearnerOwnTask(context:RequestContext,rawParams:unknown,raw:unknown){
 const {projectId}=params.parse(rawParams),input=learnerOwnTaskCreateInputSchema.parse(raw);
 const scope=await requireProjectReadAccess(context,projectId),membership=context.membership;
 if(scope.access!=="LEARNER"||!membership)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt}).from(projectInstances)
   .where(and(eq(projectInstances.id,projectId),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project||project.deletedAt||project.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await assertPersistedLearnerProjectMutation(tx,context,projectId,scope.collegeId);
  const [sprint]=input.sprintId?await tx.select().from(projectSprints)
   .where(and(eq(projectSprints.id,input.sprintId),eq(projectSprints.projectId,projectId),
     isNull(projectSprints.deletedAt)))
   .for("update").limit(1):[null];
  if(input.sprintId&&(!sprint||sprint.status!=="ACTIVE"||
   sprint.updatedAt.getTime()!==Date.parse(input.expectedSprintUpdatedAt??"")))
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  if(sprint){
   const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
    .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,projectId),
      isNull(projectReleases.deletedAt))).for("share").limit(1);
   if(!release||!["PLANNED","IN_PROGRESS"].includes(release.status))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  }
  const [last]=await tx.select({sequence:projectTasks.sequence}).from(projectTasks)
   .where(and(eq(projectTasks.projectId,projectId),
     sprint?eq(projectTasks.sprintId,sprint.id):isNull(projectTasks.sprintId)))
   .orderBy(desc(projectTasks.sequence)).limit(1);
  const [task]=await tx.insert(projectTasks).values({
   projectId,sprintId:sprint?.id??null,templateKey:keyFor(membership.id),
   sequence:nextProjectSequence(last?.sequence,"PROJECT_TASK_INVALID_STATE"),title:input.title,description:input.description,
   approach:input.approach,
   acceptanceCriteria:input.acceptanceCriteria,priority:input.priority,dueDate:input.dueDate,
   estimatePoints:input.estimatePoints,taskType:input.taskType,assigneeMembershipId:membership.id,
   status:input.status,blockerReason:input.blockerReason,
  }).returning();
  if(!task)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  if(sprint){
   await tx.update(projectSprints).set({updatedAt:new Date(Math.max(Date.now(),sprint.updatedAt.getTime()+1))})
    .where(eq(projectSprints.id,sprint.id));
  }
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_CREATED,collegeId:scope.collegeId,
    organizationId:scope.organizationId,subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
    summary:"Learner added own project task",
    metadata:{projectId,taskId:task.id,sprintId:sprint?.id??null,
      initialStatus:task.status,createdByMembershipId:membership.id,
      createdByUserId:context.user.id,createdByType:"LEARNER",
      assigneeMembershipId:membership.id,assigneeRoleKind:"LEARNER"},
    groupKey:"project:"+projectId,
  });
  await notifyActiveProjectMembers(tx,event.id,{projectId,collegeId:scope.collegeId,
   roles:["MENTOR"],exceptUserId:context.user.id,title:"Learner created a task",
   body:task.title,actionHref:"/mentor/projects/"+projectId+"?tab=board"});
  return task;
 });
}
export async function deleteLearnerOwnTask(context:RequestContext,rawParams:unknown,taskIdInput:unknown){
 const {projectId}=params.parse(rawParams),taskId=z.string().uuid().parse(taskIdInput);
 const scope=await requireProjectReadAccess(context,projectId),membership=context.membership;
 if(scope.access!=="LEARNER"||!membership)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt}).from(projectInstances)
    .where(and(eq(projectInstances.id,projectId),eq(projectInstances.collegeId,scope.collegeId)))
    .for("update").limit(1);
  if(!project||project.deletedAt||project.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await assertPersistedLearnerProjectMutation(tx,context,projectId,scope.collegeId);
  const [task]=await tx.select().from(projectTasks).where(and(eq(projectTasks.id,taskId),
    eq(projectTasks.projectId,projectId),isNull(projectTasks.deletedAt)))
    .for("update").limit(1);
  if(!task||!task.templateKey.startsWith("learner-"+membership.id.replaceAll("-","")+"-")||
    task.assigneeMembershipId!==membership.id||task.status!=="TODO")
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [sprint]=task.sprintId?await tx.select().from(projectSprints)
   .where(and(eq(projectSprints.id,task.sprintId),eq(projectSprints.projectId,projectId),
     isNull(projectSprints.deletedAt)))
   .for("update").limit(1):[null];
  if(task.sprintId&&sprint?.status!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  // A shipped release is immutable even if a stale sprint row remains ACTIVE.
  if(sprint){
   const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
    .where(and(eq(projectReleases.id,sprint.releaseId),
      eq(projectReleases.projectId,projectId),
       isNull(projectReleases.deletedAt))).for("share").limit(1);
   if(!release||!["PLANNED","IN_PROGRESS"].includes(release.status))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  }
  const [comment]=await tx.select({id:projectTaskComments.id}).from(projectTaskComments)
   .where(and(eq(projectTaskComments.projectId,projectId),eq(projectTaskComments.taskId,taskId))).limit(1);
  const [attempt]=await tx.select({id:projectTaskSubmissions.id}).from(projectTaskSubmissions)
   .where(and(eq(projectTaskSubmissions.projectId,projectId),eq(projectTaskSubmissions.taskId,taskId))).limit(1);
  if(comment||attempt)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,collegeId:scope.collegeId,
    organizationId:scope.organizationId,subjectType:"project_task",subjectId:task.id,
    subjectLabel:task.title,summary:"Learner deleted own project task",
    metadata:{projectId,taskId:task.id,deleted:true,sprintId:task.sprintId,
      createdByMembershipId:membership.id,createdByUserId:context.user.id,
      createdByType:"LEARNER",assigneeMembershipId:membership.id,
      assigneeRoleKind:"LEARNER",deletionSource:"LEARNER_OWN",
      deletedByWorkspace:true,templateKey:task.templateKey},
    groupKey:"project:"+projectId,
  });
  const now=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
  const [deleted]=await tx.update(projectTasks).set({
    deletedAt:now,deletedByWorkspace:true,updatedAt:now,
  }).where(and(eq(projectTasks.projectId,projectId),
    eq(projectTasks.id,taskId),eq(projectTasks.status,"TODO"),
    isNull(projectTasks.deletedAt))).returning({id:projectTasks.id});
  if(!deleted)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await notifyActiveProjectMembers(tx,event.id,{projectId,collegeId:scope.collegeId,
   roles:["MENTOR"],exceptUserId:context.user.id,title:"Learner deleted a task",
   body:task.title,actionHref:"/mentor/projects/"+projectId+"?tab=board"});
  return {deleted:true};
 });
}

/** Imported legacy IDs were from distinct learner/faculty namespaces.
 * The learner-owned task writer MUST NOT coerce unknown or faculty actor IDs
 * into learner memberships merely because their legacy integer happens to
 * match. Only an explicitly mapped LEARNER identity belongs here. */
export function isLegacyLearnerTaskAssignee(
  legacyType:string|null|undefined,
  assignedMembershipRoles:readonly string[],
):boolean{
 return legacyType==="LEARNER"&&assignedMembershipRoles.includes("LEARNER");
}
