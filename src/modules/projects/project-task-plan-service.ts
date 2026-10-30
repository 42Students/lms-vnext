import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints, projectTasks } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError, postgresConstraintName } from "./errors";
import { projectTaskPlanChanged, projectTaskPlanSchema } from "./project-task-plan-model";
import { projectTaskPlanToken } from "./project-task-plan-token";

/** A task-only, section-CAS bulk save. No deletes, workflow transitions or changes
 * to sprints, releases, resources, meetings, submissions or assignments.
 */
export async function saveProjectTaskPlan(
  context: RequestContext, projectId: string, raw: unknown,
) {
  const input = projectTaskPlanSchema.parse(raw);
  const scope = await requireProjectManageAccess(context, projectId);
  try {
    return await getDb().transaction(async tx => {
      const [project] = await tx.select({ id: projectInstances.id, status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId, scope.collegeId),
          isNull(projectInstances.deletedAt)))
        .for("update").limit(1);
      if (!project || !["PLANNED", "ACTIVE"].includes(project.status)) {
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      }
      await assertPersistedPlatformPermission(tx, context, "projects.manage", {
        collegeId: scope.collegeId, organizationId: scope.organizationId,
      });
      const current = await tx.select().from(projectTasks)
        .where(eq(projectTasks.projectId, scope.project.id))
        .orderBy(asc(projectTasks.id)).for("update");

      // Membership + updatedAt + state token belongs only to the tasks section.
      // A concurrent task save or workflow transition invalidates the whole batch.
      if (projectTaskPlanToken(current) !== input.expectedTasksToken) {
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      }
      const byId = new Map(current.map(row => [row.id, row]));
      const changes = input.tasks.map(row => ({ next: row, prior: byId.get(row.id) }));
      if (changes.some(change => !change.prior || change.prior.deletedAt)) {
        throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
      }
      const changed = changes.filter(({ prior, next }) => projectTaskPlanChanged(prior!, next));
      if (!changed.length) {
        return { changed: false, updatedTaskIds: [], tasksToken: input.expectedTasksToken };
      }
      // Do not alter submitted/done tasks. Leave their content and history intact.
      if (changed.some(({ prior }) => !prior || ["IN_REVIEW", "DONE"].includes(prior.status))) {
        throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
      }

      const sprints = await tx.select({
        id: projectSprints.id, status: projectSprints.status,
        releaseId: projectSprints.releaseId,
      }).from(projectSprints).where(eq(projectSprints.projectId, scope.project.id));
      const releases = await tx.select({ id: projectReleases.id, status: projectReleases.status })
        .from(projectReleases).where(and(eq(projectReleases.projectId, scope.project.id),
          isNull(projectReleases.deletedAt)));
      const sprintMap = new Map(sprints.map(sprint => [sprint.id, sprint]));
      const releaseMap = new Map(releases.map(release => [release.id, release]));

      for (const { prior, next } of changed) {
        // A started/blocked task may only be moved into an ACTIVE sprint;
        // PLANNED sprints and the backlog can hold TODO work, not started work.
        if (prior!.sprintId !== next.sprintId && prior!.status !== "TODO" &&
            (!next.sprintId || sprintMap.get(next.sprintId)?.status !== "ACTIVE")) {
          throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
        }
        // Both source and target must still permit edits; never migrate tasks out
        // of a completed sprint or into a shipped release.
        for (const sprintId of [prior!.sprintId, next.sprintId]) {
          if (!sprintId) continue;
          const sprint = sprintMap.get(sprintId);
          if (!sprint || !["PLANNED", "ACTIVE"].includes(sprint.status) ||
              releaseMap.get(sprint.releaseId)?.status === "SHIPPED" ||
              !releaseMap.has(sprint.releaseId)) {
            throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
          }
        }
      }
      // Legacy key is a human-facing label. Keep the stable templateKey/ID for
      // existing foreign keys, and prevent duplicate effective labels in the plan.
      const editsById = new Map(input.tasks.map(row => [row.id, row]));
      const editedKeyIds = new Set(changed.filter(({ prior, next }) =>
        (prior!.legacyTaskKey || prior!.templateKey).toLowerCase() !== next.key.toLowerCase()
      ).map(({ next }) => next.id));
      const seenKeys = new Map<string, string>();
      for (const task of current.filter(row => !row.deletedAt)) {
        const effectiveKey = editsById.get(task.id)?.key ?? (task.legacyTaskKey || task.templateKey);
        const lookup = effectiveKey.toLowerCase();
        const previous = seenKeys.get(lookup);
        // Existing historical label duplicates are not grounds to block a
        // metadata-only save. Reject new collisions introduced by this edit.
        if (previous && (editedKeyIds.has(previous) || editedKeyIds.has(task.id))) {
          throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
        }
        if (!previous) seenKeys.set(lookup, task.id);
      }
      const nextSequence = new Map<string, number>();
      for (const task of current) {
        const group = task.sprintId ?? "__BACKLOG__";
        nextSequence.set(group, Math.max(nextSequence.get(group) ?? -1, task.sequence));
      }
      const latestTimestamp = current.reduce(
        (latest, task) => Math.max(latest, task.updatedAt.getTime()), Date.now());
      const now = new Date(latestTimestamp + 1);
      const updatedTaskIds: string[] = [];
      for (const { prior, next } of changed) {
        const task = prior!;
        const moved = task.sprintId !== next.sprintId;
        const destination = next.sprintId ?? "__BACKLOG__";
        const sequence = moved ? (nextSequence.get(destination) ?? -1) + 1 : task.sequence;
        if (moved) nextSequence.set(destination, sequence);
        const [updated] = await tx.update(projectTasks).set({
          legacyTaskKey: next.key === task.templateKey && task.legacyTaskKey === null
            ? null : next.key,
          title: next.title,
          priority: next.priority,
          sprintId: next.sprintId,
          ...(moved ? { sequence } : {}),
          estimatePoints: next.estimatePoints, taskType: next.taskType,
          dueLabel: next.dueLabel, description: next.description,
          acceptanceCriteria: next.acceptanceCriteria, approach: next.approach,
          updatedAt: now,
        }).where(and(eq(projectTasks.id, task.id),
          eq(projectTasks.projectId, scope.project.id))).returning();
        if (!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
        updatedTaskIds.push(updated.id);
      }
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
        collegeId: scope.collegeId, organizationId: scope.organizationId,
        subjectType: "project", subjectId: scope.project.id,
        subjectLabel: scope.project.title, summary: "Project task plan saved",
        metadata: { projectId: scope.project.id, updatedTaskIds,
          movedTaskIds: changed.filter(({ prior, next }) => prior!.sprintId !== next.sprintId)
            .map(({ next }) => next.id) },
        groupKey: "project:" + scope.project.id,
        dedupeKey: "project-task-plan:" + scope.project.id + ":" + randomUUID(),
      });
      // Return an updated token from the database, not reconstructed rows:
      // sprint allocation may have advanced sequence values.
      const persisted = await tx.select().from(projectTasks)
        .where(eq(projectTasks.projectId, scope.project.id));
      return { changed: true, updatedTaskIds,
        tasksToken: projectTaskPlanToken(persisted) };
    });
  } catch (error) {
    if (postgresConstraintName(error) === "project_tasks_project_key_uq" ||
        postgresConstraintName(error) === "project_tasks_sprint_sequence_uq") {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }
    throw error;
  }
}
