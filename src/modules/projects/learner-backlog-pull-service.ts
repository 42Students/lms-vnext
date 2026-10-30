import "server-only";
import {nextProjectSequence} from "./project-sequence-allocation";
import { and,desc,eq,isNull,sql } from "drizzle-orm";
import { z } from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectTasks,projectSprints,projectReleases} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {assertPersistedLearnerProjectMutation} from "./learner-mutation-guard";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {notifyActiveProjectMembers} from "./project-notification-service";
export const learnerBacklogPullInputSchema=z.strictObject({
 taskId:z.string().uuid(),sprintId:z.string().uuid(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
/** LEARNER-projects-29: learners may pull only their own queued task into an active sprint. */
export async function pullOwnBacklogTask(context:RequestContext,projectIdInput:string,raw:unknown){
 const input=learnerBacklogPullInputSchema.parse(raw),scope=await requireProjectReadAccess(context,projectIdInput);
 if(scope.access!=="LEARNER"||!context.membership)
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const membership=context.membership;
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({status:projectInstances.status}).from(projectInstances)
    .where(and(eq(projectInstances.id,scope.project.id),eq(projectInstances.collegeId,scope.collegeId),isNull(projectInstances.deletedAt)))
    .for("update").limit(1);
  if(project?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  await assertPersistedLearnerProjectMutation(tx,context,scope.project.id,scope.collegeId);
  const [task]=await tx.select().from(projectTasks)
    .where(and(eq(projectTasks.id,input.taskId),eq(projectTasks.projectId,scope.project.id),
      isNull(projectTasks.deletedAt)))
    .for("update").limit(1);
  if(!task||task.sprintId!==null||task.status!=="TODO"||
    task.assigneeMembershipId!==membership.id||
    task.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
    throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [sprint]=await tx.select().from(projectSprints)
    .where(and(eq(projectSprints.id,input.sprintId),eq(projectSprints.projectId,scope.project.id),
      isNull(projectSprints.deletedAt)))
    .for("update").limit(1);
  if(sprint?.status!=="ACTIVE")throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [release]=await tx.select({status:projectReleases.status}).from(projectReleases)
    .where(and(eq(projectReleases.id,sprint.releaseId),eq(projectReleases.projectId,scope.project.id),
      isNull(projectReleases.deletedAt)))
    .for("share").limit(1);
  if(!release||!["PLANNED","IN_PROGRESS"].includes(release.status))throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const [last]=await tx.select({sequence:projectTasks.sequence}).from(projectTasks)
    .where(and(eq(projectTasks.projectId,scope.project.id),eq(projectTasks.sprintId,sprint.id)))
    .orderBy(desc(projectTasks.sequence)).limit(1);
  const [updated]=await tx.update(projectTasks).set({
    sprintId:sprint.id,sequence:nextProjectSequence(last?.sequence,"PROJECT_TASK_INVALID_STATE"),
    updatedAt:new Date(Math.max(Date.now(),task.updatedAt.getTime()+1)),
  }).where(and(eq(projectTasks.projectId,scope.project.id),eq(projectTasks.id,task.id),
    isNull(projectTasks.sprintId),isNull(projectTasks.deletedAt),
    sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`)).returning();
  if(!updated)throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
  const event=await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
    summary:"Learner pulled task into active sprint",
    metadata:{projectId:scope.project.id,taskId:task.id,sprintId:sprint.id},
    groupKey:"project:"+scope.project.id,
  });
  await notifyActiveProjectMembers(tx,event.id,{
    projectId:scope.project.id,collegeId:scope.collegeId,
    roles:["MENTOR"],exceptUserId:context.user.id,
    title:"Task pulled into sprint",body:task.title+" was pulled into "+sprint.title+".",
    actionHref:"/mentor/projects/"+scope.project.id+"?tab=board",
  });
  return updated;
 });
}
