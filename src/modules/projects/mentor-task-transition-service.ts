import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints, projectTasks } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { requireProjectLifecycleAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { mentorTaskTransitionParamsSchema, mentorTaskTransitionSchema, allowedMentorTaskTransition }
  from "./mentor-task-transition-model";

export async function transitionMentorProjectTask(
  context: RequestContext, rawParams: unknown, rawInput: unknown,
) {
  const params = mentorTaskTransitionParamsSchema.parse(rawParams);
  const input = mentorTaskTransitionSchema.parse(rawInput);
  if (!hasActiveMembership(context) || !hasMembershipRole(context, "MENTOR"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const scope = await requireProjectLifecycleAccess(context, params.projectId);
  if (scope.access !== "MENTOR" || !can(context, "projects.read", {
    collegeId: scope.collegeId, organizationId: scope.organizationId,
  })) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if (!(await resolveOptionalModuleAccess(context)).projects.enabled)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  return getDb().transaction(async tx => {
    const [project] = await tx.select({status:projectInstances.status})
      .from(projectInstances).where(and(
        eq(projectInstances.id,scope.project.id), eq(projectInstances.collegeId,scope.collegeId),
      )).for("update").limit(1);
    if (!project || !["PLANNED","ACTIVE"].includes(project.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [task] = await tx.select().from(projectTasks).where(and(
      eq(projectTasks.id,params.taskId), eq(projectTasks.projectId,scope.project.id),
    )).for("update").limit(1);
    if (!task) throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if (!allowedMentorTaskTransition(task.status,input.status) ||
      task.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime())
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [sprint] = await tx.select({status:projectSprints.status,releaseId:projectSprints.releaseId})
      .from(projectSprints).where(and(
        eq(projectSprints.id,task.sprintId), eq(projectSprints.projectId,scope.project.id),
      )).for("update").limit(1);
    if (!sprint || sprint.status !== "ACTIVE")
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const [release] = await tx.select({status:projectReleases.status})
      .from(projectReleases).where(and(
        eq(projectReleases.id,sprint.releaseId), eq(projectReleases.projectId,scope.project.id),
      )).limit(1);
    if (!release || release.status === "SHIPPED")
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const now = new Date(Math.max(Date.now(),task.updatedAt.getTime()+1));
    const [updated] = await tx.update(projectTasks).set({
      status:input.status,updatedAt:now,
    }).where(and(
      eq(projectTasks.id,task.id),eq(projectTasks.projectId,scope.project.id),
      eq(projectTasks.status,task.status),
      sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
    )).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_STATUS_CHANGED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_task",subjectId:task.id,subjectLabel:updated.title,
      summary:"Project task status changed",
      metadata:{projectId:scope.project.id,taskId:task.id,previousStatus:task.status,
        nextStatus:updated.status,reviewRequiredForDone:true},
      groupKey:"project:"+scope.project.id,
      dedupeKey:"project-task:"+task.id+":status:"+randomUUID(),
    });
    return updated;
  });
}
