import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints, projectTasks } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { notifyActiveProjectMembers } from "./project-notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectReadAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import {assertPersistedLearnerProjectMutation} from "./learner-mutation-guard";
import {
  learnerTaskProgressInputSchema, learnerTaskProgressParamsSchema, learnerTaskTransitionAllowed,
} from "./learner-task-progress-model";

export async function updateLearnerProjectTaskProgress(
  context: RequestContext, rawParams: unknown, rawInput: unknown,
) {
  const params = learnerTaskProgressParamsSchema.parse(rawParams);
  const input = learnerTaskProgressInputSchema.parse(rawInput);
  const scope = await requireProjectReadAccess(context, params.projectId);
  if (scope.access !== "LEARNER" || !context.membership)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const membershipId = context.membership.id;

  return getDb().transaction(async tx => {
    const [project] = await tx.select({ status: projectInstances.status }).from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id), eq(projectInstances.collegeId, scope.collegeId),
        isNull(projectInstances.deletedAt)))
      .for("update").limit(1);
    if (!project || project.status !== "ACTIVE")
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await assertPersistedLearnerProjectMutation(tx,context,scope.project.id,scope.collegeId);

    const [candidate] = await tx.select({ sprintId: projectTasks.sprintId }).from(projectTasks)
      .where(and(eq(projectTasks.projectId, scope.project.id), eq(projectTasks.id, params.taskId),
        isNull(projectTasks.deletedAt))).limit(1);
    if (!candidate) throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if (!candidate.sprintId) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    // Project then sprint then tasks: consistent lock order serializes competing reorders.
    const [sprint] = await tx.select({ status: projectSprints.status, releaseId: projectSprints.releaseId })
      .from(projectSprints).where(and(
        eq(projectSprints.id, candidate.sprintId), eq(projectSprints.projectId, scope.project.id),
        isNull(projectSprints.deletedAt),
      )).for("update").limit(1);
    if (!sprint || sprint.status !== "ACTIVE")
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    const [release] = await tx.select({ status: projectReleases.status }).from(projectReleases)
      .where(and(eq(projectReleases.id, sprint.releaseId), eq(projectReleases.projectId, scope.project.id),
         isNull(projectReleases.deletedAt)))
      .for("share").limit(1);
    if (!release || !["PLANNED","IN_PROGRESS"].includes(release.status))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    const allSiblings = await tx.select().from(projectTasks).where(and(
      eq(projectTasks.projectId, scope.project.id), eq(projectTasks.sprintId, candidate.sprintId),
    )).orderBy(asc(projectTasks.sequence), asc(projectTasks.id)).for("update");
    // Soft-deleted tasks cannot move, but their reserved sequence numbers are
    // still covered by the unconditional sprint/sequence unique index.
    const siblings = allSiblings.filter(item => !item.deletedAt);
    const task = siblings.find(item => item.id === params.taskId);
    if (!task) throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if (task.assigneeMembershipId !== membershipId)
      throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
    if (!["TODO", "IN_PROGRESS", "BLOCKED"].includes(task.status) ||
      task.updatedAt.getTime() !== Date.parse(input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    const now = new Date(Math.max(Date.now(), task.updatedAt.getTime() + 1));
    if (input.action === "STATUS") {
      if (!learnerTaskTransitionAllowed(
        task.status, input.status,
        input.status === "BLOCKED" ? input.blockerNote : task.blockerReason,
      )) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      const [updated] = await tx.update(projectTasks).set({
        status: input.status, updatedAt: now,
        ...(input.status === "BLOCKED" ? { blockerReason: input.blockerNote!.trim() } : { blockerReason: null }),
      }).where(and(eq(projectTasks.id, task.id), eq(projectTasks.projectId, scope.project.id))).returning();
      if (!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      const taskEvent = await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TASK_STATUS_CHANGED,
        collegeId: scope.collegeId, organizationId: scope.organizationId,
        subjectType: "project_task", subjectId: updated.id, subjectLabel: updated.title,
        summary: input.status === "BLOCKED" ? "Project task blocker reported" : "Project task status changed",
        metadata: {
          projectId: scope.project.id, taskId: updated.id, previousStatus: task.status,
          nextStatus: updated.status, reportedByMembershipId: membershipId, reviewRequiredForDone: true,
        },
        groupKey: "project:" + scope.project.id,
        dedupeKey: "project-task:" + updated.id + ":learner-status:" + randomUUID(),
      });
      if (input.status === "BLOCKED" || task.status === "BLOCKED") {
        await notifyActiveProjectMembers(tx, taskEvent.id, {
          projectId: scope.project.id, collegeId: scope.collegeId,
          roles: ["MENTOR"], title: input.status === "BLOCKED" ? "Project task blocked" : "Task blocker resolved",
          body: (input.status === "BLOCKED" ? "A learner reported a blocker on " : "A learner resolved a blocker on ") + updated.title + ".",
          actionHref: "/mentor/projects/" + scope.project.id + "?tab=board",
          exceptUserId: context.user.id,
        });
      }
      return updated;
    }

    const index = siblings.findIndex(item => item.id === task.id);
    const other = siblings[index + (input.action === "MOVE_UP" ? -1 : 1)];
    if (!other) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    // Unique(sprint, sequence) is immediate; use an unused temporary sequence.
    const maxReservedSequence = Math.max(...allSiblings.map(item => item.sequence));
    if (maxReservedSequence >= 2147483647)
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const temporary = maxReservedSequence + 1;
    await tx.update(projectTasks).set({ sequence: temporary, updatedAt: now })
      .where(and(eq(projectTasks.id, task.id), eq(projectTasks.projectId, scope.project.id)));
    await tx.update(projectTasks).set({ sequence: task.sequence, updatedAt: now })
      .where(and(eq(projectTasks.id, other.id), eq(projectTasks.projectId, scope.project.id)));
    const [updated] = await tx.update(projectTasks).set({
      sequence: other.sequence, updatedAt: now,
    }).where(and(eq(projectTasks.id, task.id), eq(projectTasks.projectId, scope.project.id))).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project_task", subjectId: updated.id, subjectLabel: updated.title,
      summary: "Project task order updated",
      metadata: {
        projectId: scope.project.id, taskId: updated.id, previousSequence: task.sequence,
        nextSequence: updated.sequence, reportedByMembershipId: membershipId,
      },
      groupKey: "project:" + scope.project.id,
    });
    return updated;
  });
}
