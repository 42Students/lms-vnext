import "server-only";

import {randomUUID} from "node:crypto";
import {and,desc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectReleases,projectSprints,projectTasks} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectManageAccess} from "./access";
import {ProjectsServiceError,postgresConstraintName} from "./errors";
import {projectTaskPlanToken} from "./project-task-plan-token";
import {adminTaskPlanCreateSchema} from "./admin-task-plan-create-model";

/** College Admin/Super Admin task planning creates only TODO rows, leaving
 * workflow and learner assignment to the authorized task controls.
 * Compare the complete task section under a project write lock. */
export async function createAdminTaskPlanItem(
 context:RequestContext, projectId:string, raw:unknown,
){
 const input=adminTaskPlanCreateSchema.parse(raw);
 const scope=await requireProjectManageAccess(context,projectId);
 try{
  return await getDb().transaction(async tx=>{
   const [project]=await tx.select({status:projectInstances.status})
    .from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
      eq(projectInstances.collegeId,scope.collegeId),
      isNull(projectInstances.deletedAt))).for("update").limit(1);
   if(!project||!["PLANNED","ACTIVE"].includes(project.status))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   await assertPersistedPlatformPermission(tx,context,"projects.manage",{
    collegeId:scope.collegeId,organizationId:scope.organizationId,
   });
   const current=await tx.select().from(projectTasks)
    .where(eq(projectTasks.projectId,scope.project.id)).for("update");
   if(projectTaskPlanToken(current)!==input.expectedTasksToken)
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   const active=current.filter(task=>!task.deletedAt);
   if(active.length>=500)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   const slug=input.title.normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100)||"task";
   const requested=input.key?.trim()??"";
   const keys=new Set(active.flatMap(task=>
    [task.legacyTaskKey,task.templateKey].filter((key):key is string=>Boolean(key))
      .map(key=>key.toLowerCase())));
   if(requested&&keys.has(requested.toLowerCase()))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   let key=requested||slug;
   if(!requested){
    let suffix=2;
    while(keys.has(key.toLowerCase())){
     const tail="-"+suffix++;
     key=slug.slice(0,120-tail.length)+tail;
    }
   }
   let sprintId:string|null=null;
   if(input.sprintId){
    const [sprint]=await tx.select({
      id:projectSprints.id,status:projectSprints.status,
      releaseId:projectSprints.releaseId,
    }).from(projectSprints).where(and(eq(projectSprints.id,input.sprintId),
      eq(projectSprints.projectId,scope.project.id),
      isNull(projectSprints.deletedAt))).for("share").limit(1);
    if(!sprint||!["PLANNED","ACTIVE"].includes(sprint.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [release]=await tx.select({status:projectReleases.status})
      .from(projectReleases).where(and(eq(projectReleases.id,sprint.releaseId),
        eq(projectReleases.projectId,scope.project.id),
        isNull(projectReleases.deletedAt))).for("share").limit(1);
    if(!release||release.status==="SHIPPED")
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    sprintId=sprint.id;
   }
   const [last]=await tx.select({sequence:projectTasks.sequence})
    .from(projectTasks).where(and(eq(projectTasks.projectId,scope.project.id),
      sprintId?eq(projectTasks.sprintId,sprintId):isNull(projectTasks.sprintId)))
    .orderBy(desc(projectTasks.sequence)).limit(1);
   const [created]=await tx.insert(projectTasks).values({
    projectId:scope.project.id,sprintId,
    templateKey:"admin-"+randomUUID().replaceAll("-",""),
    legacyTaskKey:key,sequence:(last?.sequence??-1)+1,
    title:input.title,status:"TODO",priority:input.priority,
    estimatePoints:input.estimatePoints,taskType:input.taskType,
    dueLabel:input.dueLabel,description:input.description,
    acceptanceCriteria:input.acceptanceCriteria,approach:input.approach,
    assigneeMembershipId:null,
   }).returning();
   if(!created)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_CREATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_task",subjectId:created.id,
    subjectLabel:created.title,summary:"Project task created",
    metadata:{projectId:scope.project.id,taskId:created.id,sprintId,
      source:"ADMIN_TASK_PLAN"},
    groupKey:"project:"+scope.project.id,
    dedupeKey:"admin-project-task:"+created.id+":created",
   });
   const updated=await tx.select().from(projectTasks)
    .where(eq(projectTasks.projectId,scope.project.id));
   return {task:created,tasksToken:projectTaskPlanToken(updated)};
  });
 }catch(error){
  if(["project_tasks_project_key_uq","project_tasks_sprint_sequence_uq"]
    .includes(postgresConstraintName(error)??""))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  throw error;
 }
}
