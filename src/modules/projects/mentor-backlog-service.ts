import {randomUUID} from "node:crypto";
import "server-only";
import {and,eq,ne,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectTasks,projectSprints,projectReleases} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectLifecycleMutationAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";

export function projectBacklogSchemaReady(){
 return process.env.PROJECT_BACKLOG_SCHEMA_READY==="true";
}
const inputSchema=z.strictObject({
 taskId:z.string().uuid(),targetSprintId:z.string().uuid().nullable(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
export async function moveMentorBacklogTask(context:RequestContext,projectIdInput:string,raw:unknown){
 if(!projectBacklogSchemaReady())throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
 const input=inputSchema.parse(raw),scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(project?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [task]=await tx.select().from(projectTasks)
    .where(and(eq(projectTasks.id,input.taskId),eq(projectTasks.projectId,scope.project.id)))
    .for("update").limit(1);
  if(!task||task.status==="DONE"||task.status==="IN_REVIEW"||
     task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  if(input.targetSprintId){
   const [sprint]=await tx.select({id:projectSprints.id,status:projectSprints.status,releaseId:projectSprints.releaseId})
    .from(projectSprints).where(and(eq(projectSprints.id,input.targetSprintId),
      eq(projectSprints.projectId,scope.project.id))).for("update").limit(1);
   if(!sprint||sprint.status==="COMPLETED")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
     .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,scope.project.id))).limit(1);
   if(release?.status==="SHIPPED")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  }
  const sequenceRow=await tx.execute(sql`select coalesce(max(sequence),-1)+1 as next from project_tasks
    where project_id = ${scope.project.id}::uuid
      and sprint_id is not distinct from ${input.targetSprintId}::uuid`);
  const next=Number((sequenceRow as unknown as {rows:{next:number}[]}).rows?.[0]?.next??0);
  const now=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
  // Raw update is intentional while the nullable sprint column is staged.
  const changed=await tx.execute(sql`update project_tasks
    set sprint_id=${input.targetSprintId}::uuid,sequence=${next},
      carried_from_sprint_id=case when ${input.targetSprintId}::uuid is null then sprint_id else carried_from_sprint_id end,
      carried_over_at=case when ${input.targetSprintId}::uuid is null then ${now}::timestamptz else carried_over_at end,
      updated_at=${now}::timestamptz
    where id=${task.id}::uuid and project_id=${scope.project.id}::uuid
      and updated_at=${task.updatedAt}::timestamptz returning id`);
  if(!(changed as unknown as {rows:unknown[]}).rows?.length)
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
   summary:input.targetSprintId?"Task pulled into sprint":"Task returned to product backlog",
   metadata:{projectId:scope.project.id,taskId:task.id,fromSprintId:task.sprintId,
    targetSprintId:input.targetSprintId},groupKey:"project:"+scope.project.id,
  });
  return {taskId:task.id,targetSprintId:input.targetSprintId};
 });
}

const createBacklogSchema=z.strictObject({
 title:z.string().trim().min(1).max(200),
 description:z.string().trim().max(4000).nullable().default(null),
 acceptanceCriteria:z.string().trim().max(4000).nullable().default(null),
 priority:z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
 estimatePoints:z.number().int().min(0).max(1000).nullable().default(null),
});
export async function createMentorBacklogTask(context:RequestContext,projectIdInput:string,raw:unknown){
 if(!projectBacklogSchemaReady())throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
 const input=createBacklogSchema.parse(raw),scope=await requireProjectLifecycleMutationAccess(context,projectIdInput);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
   .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId)))
   .for("update").limit(1);
  if(!project||!["PLANNED","ACTIVE"].includes(project.status))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const next=await tx.execute(sql`select coalesce(max(sequence),-1)+1 as seq
    from project_tasks where project_id=${scope.project.id}::uuid and sprint_id is null`);
  const sequence=Number((next as unknown as {rows:{seq:number}[]}).rows?.[0]?.seq??0);
  const taskId=randomUUID(),key="backlog-"+randomUUID().replaceAll("-","");
  await tx.execute(sql`insert into project_tasks
    (id,project_id,sprint_id,template_key,sequence,title,description,
    acceptance_criteria,priority,status,estimate_points)
    values (${taskId}::uuid,${scope.project.id}::uuid,null,${key},${sequence},${input.title},
    ${input.description},${input.acceptanceCriteria},${input.priority},'TODO',${input.estimatePoints})`);
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_CREATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"project_task",subjectId:taskId,subjectLabel:input.title,
   summary:"Product backlog task created",
   metadata:{projectId:scope.project.id,taskId,backlog:true},groupKey:"project:"+scope.project.id,
  });
  return {id:taskId,title:input.title,sequence};
 });
}
