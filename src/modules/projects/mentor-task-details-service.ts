import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints, projectTasks } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectLifecycleMutationAccess } from "./access";
import { assertPersistedProjectMutationActor } from "./persisted-mentor-mutation";
import { ProjectsServiceError } from "./errors";
import {
  mentorTaskDetailsParamsSchema,mentorTaskDetailsInputSchema,taskDetailsChangedFields,
} from "./mentor-task-details-model";

/** Edit only registered task metadata; never mutate assignee, sprint or task status. */
export async function updateMentorTaskDetails(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
) {
  const params=mentorTaskDetailsParamsSchema.parse(rawParams);
  const input=mentorTaskDetailsInputSchema.parse(rawInput);
  const scope=await requireProjectLifecycleMutationAccess(context,params.projectId);
  const expected=new Date(input.expectedUpdatedAt);
  return getDb().transaction(async tx=>{
    const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt})
      .from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if(!project||project.deletedAt||!["PLANNED","ACTIVE"].includes(project.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [task]=await tx.select().from(projectTasks)
      .where(and(eq(projectTasks.id,params.taskId),
        eq(projectTasks.projectId,scope.project.id),
        isNull(projectTasks.deletedAt)))
      .for("update").limit(1);
    if(!task) throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if(task.status==="IN_REVIEW"||task.status==="DONE")
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    const [sprint]=task.sprintId?await tx.select({
      status:projectSprints.status,releaseId:projectSprints.releaseId,
    }).from(projectSprints)
      .where(and(eq(projectSprints.id,task.sprintId),
        eq(projectSprints.projectId,scope.project.id),
        isNull(projectSprints.deletedAt)))
      .limit(1):[null];
    if(task.sprintId&&(!sprint||sprint.status==="COMPLETED"))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    if(sprint){
      const [release]=await tx.select({status:projectReleases.status})
        .from(projectReleases)
        .where(and(eq(projectReleases.id,sprint.releaseId),
          eq(projectReleases.projectId,scope.project.id),
           isNull(projectReleases.deletedAt)))
        .limit(1);
      if(!release||release.status==="SHIPPED")
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }

    // PostgreSQL stores microseconds but JS Date tokens carry milliseconds.
    // The locked row and millisecond comparison are the concurrency boundary.
    if(task.updatedAt.getTime()!==expected.getTime())
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const changed=taskDetailsChangedFields(task,input);
    if(!changed.length)
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const now=new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
    const [updated]=await tx.update(projectTasks).set({
      title:input.title,description:input.description,
      ...(input.approach!==undefined?{approach:input.approach}:{}),
      acceptanceCriteria:input.acceptanceCriteria,priority:input.priority,
      ...(input.blockerReason!==undefined?{blockerReason:input.blockerReason}:{}),
      ...(input.dueDate!==undefined?{dueDate:input.dueDate}:{}),
      ...(input.estimatePoints!==undefined?{estimatePoints:input.estimatePoints}:{}),
      ...(input.taskType!==undefined?{taskType:input.taskType}:{}),
      updatedAt:now,
    }).where(and(
      eq(projectTasks.id,task.id),eq(projectTasks.projectId,scope.project.id),
      // PostgreSQL stores microseconds but incoming Date tokens store milliseconds.
      // This predicate remains true for a row created by SQL DEFAULT now().
      sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${expected.toISOString()}::timestamptz`,
    )).returning();
    if(!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_task",subjectId:updated.id,
      subjectLabel:updated.title,summary:"Project task details updated",
      metadata:{projectId:scope.project.id,taskId:updated.id,changedFields:changed,
        approachChanged:changed.includes("approach")},
      groupKey:"project:"+scope.project.id,
      dedupeKey:"project-task:"+updated.id+":details:"+randomUUID(),
    });
    return updated;
  });
}
