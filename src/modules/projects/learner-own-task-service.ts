import "server-only";
import {randomUUID} from "node:crypto";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectSprints,projectReleases,projectTasks,projectTaskComments,projectTaskSubmissions} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyActiveProjectMembers} from "./project-notification-service";

const params=z.strictObject({projectId:z.string().uuid()});
const create=z.strictObject({
 sprintId:z.string().uuid(),title:z.string().trim().min(1).max(200),
 description:z.string().trim().max(4000).nullable().default(null),
 acceptanceCriteria:z.string().trim().max(4000).nullable().default(null),
 priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
 dueDate:z.iso.date().nullable().default(null),
 estimatePoints:z.number().int().min(0).max(1000).nullable().default(null),
 taskType:z.enum(["STORY","BUG","CHORE","SPIKE"]).nullable().default(null),
 expectedSprintUpdatedAt:z.iso.datetime({offset:true}),
});
function keyFor(membershipId:string){return "learner-"+membershipId.replaceAll("-","")+"-"+randomUUID().slice(0,8);}
export async function createLearnerOwnTask(context:RequestContext,rawParams:unknown,raw:unknown){
 const {projectId}=params.parse(rawParams),input=create.parse(raw);
 const scope=await requireProjectReadAccess(context,projectId),membership=context.membership;
 if(scope.access!=="LEARNER"||!membership)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,projectId),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(project?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [sprint]=await tx.select().from(projectSprints)
   .where(and(eq(projectSprints.id,input.sprintId),eq(projectSprints.projectId,projectId)))
   .for("update").limit(1);
  if(!sprint||sprint.status!=="ACTIVE"||
   sprint.updatedAt.getTime()!==Date.parse(input.expectedSprintUpdatedAt))
   throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
   .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,projectId))).limit(1);
  if(!release||release.status==="SHIPPED")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [last]=await tx.select({sequence:projectTasks.sequence}).from(projectTasks)
   .where(eq(projectTasks.sprintId,sprint.id)).orderBy(desc(projectTasks.sequence)).limit(1);
  const [task]=await tx.insert(projectTasks).values({
   projectId,sprintId:sprint.id,templateKey:keyFor(membership.id),
   sequence:(last?.sequence??-1)+1,title:input.title,description:input.description,
   acceptanceCriteria:input.acceptanceCriteria,priority:input.priority,dueDate:input.dueDate,
   estimatePoints:input.estimatePoints,taskType:input.taskType,assigneeMembershipId:membership.id,
   status:"TODO",
  }).returning();
  if(!task)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await tx.update(projectSprints).set({updatedAt:new Date(Math.max(Date.now(),sprint.updatedAt.getTime()+1))})
    .where(eq(projectSprints.id,sprint.id));
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_CREATED,collegeId:scope.collegeId,
    organizationId:scope.organizationId,subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
    summary:"Learner added own project task",
    metadata:{projectId,taskId:task.id,sprintId:sprint.id,createdByMembershipId:membership.id},
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
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
    .where(and(eq(projectInstances.id,projectId),eq(projectInstances.collegeId,scope.collegeId)))
    .for("update").limit(1);
  if(project?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [task]=await tx.select().from(projectTasks).where(and(eq(projectTasks.id,taskId),
    eq(projectTasks.projectId,projectId))).for("update").limit(1);
  if(!task||!task.templateKey.startsWith("learner-"+membership.id.replaceAll("-","")+"-")||
    task.assigneeMembershipId!==membership.id||task.status!=="TODO")
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [sprint]=await tx.select().from(projectSprints)
   .where(and(eq(projectSprints.id,task.sprintId),eq(projectSprints.projectId,projectId))).for("update").limit(1);
  if(sprint?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [comment]=await tx.select({id:projectTaskComments.id}).from(projectTaskComments)
   .where(and(eq(projectTaskComments.projectId,projectId),eq(projectTaskComments.taskId,taskId))).limit(1);
  const [attempt]=await tx.select({id:projectTaskSubmissions.id}).from(projectTaskSubmissions)
   .where(and(eq(projectTaskSubmissions.projectId,projectId),eq(projectTaskSubmissions.taskId,taskId))).limit(1);
  if(comment||attempt)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,collegeId:scope.collegeId,
    organizationId:scope.organizationId,subjectType:"project_task",subjectId:task.id,
    subjectLabel:task.title,summary:"Learner deleted own project task",
    metadata:{projectId,taskId:task.id,deleted:true,createdByMembershipId:membership.id},
    groupKey:"project:"+projectId,
  });
  await tx.delete(projectTasks).where(and(eq(projectTasks.projectId,projectId),eq(projectTasks.id,taskId)));
  await notifyActiveProjectMembers(tx,event.id,{projectId,collegeId:scope.collegeId,
   roles:["MENTOR"],exceptUserId:context.user.id,title:"Learner deleted a task",
   body:task.title,actionHref:"/mentor/projects/"+projectId+"?tab=board"});
  return {deleted:true};
 });
}
