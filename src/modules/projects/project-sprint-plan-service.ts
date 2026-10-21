import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectReleases, projectSprints } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectSprintPlanFieldsChanged, projectSprintPlanSchema } from "./project-sprint-plan-model";

/** Atomic admin save of the complete sprint plan for one release.
 * Reordering never touches task, resource, meeting or other release records.
 * Two-pass renumbering avoids the non-deferrable (release_id, sequence) unique index.
 */
export async function saveProjectSprintPlan(
  context: RequestContext,
  projectId: string,
  rawInput: unknown,
) {
  const input = projectSprintPlanSchema.parse(rawInput);
  const scope = await requireProjectManageAccess(context, projectId);
  return getDb().transaction(async tx => {
    const [project] = await tx.select({ id: projectInstances.id, status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId, scope.collegeId)))
      .for("update").limit(1);
    if (!project || !["PLANNED", "ACTIVE"].includes(project.status)) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    // Re-check the live actor after obtaining the project lock, not only request snapshot roles.
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });
    const [release] = await tx.select({ id: projectReleases.id, status: projectReleases.status })
      .from(projectReleases)
      .where(and(eq(projectReleases.id, input.releaseId),
        eq(projectReleases.projectId, scope.project.id)))
      .for("update").limit(1);
    if (!release || release.status === "SHIPPED") {
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    }
    const current = await tx.select().from(projectSprints)
      .where(and(eq(projectSprints.projectId, scope.project.id),
        eq(projectSprints.releaseId, release.id)))
      .orderBy(asc(projectSprints.sequence), asc(projectSprints.id))
      .for("update");

    // Require the entire release, not a partial row list: omitted siblings must never be deleted
    // or unintentionally renumbered. Active/completed sprints are immutable in this plan editor.
    if (current.length !== input.sprints.length ||
        current.some(sprint => sprint.status !== "PLANNED")) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const original = new Map(current.map(sprint => [sprint.id, sprint]));
    if (input.sprints.some(sprint => !original.has(sprint.id))) {
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
    }
    const reordered = input.sprints.some((sprint, index) => sprint.id !== current[index]?.id);
    const changedIds = input.sprints.filter(row =>
      projectSprintPlanFieldsChanged(original.get(row.id)!, row)).map(row => row.id);
    // Retrying a request that reached its desired state is an authorized no-op,
    // even when its prior response was lost and the submitted tokens are now stale.
    if (!reordered && changedIds.length === 0) {
      return { changed: false, sprints: current };
    }
    for (const next of input.sprints) {
      const previous = original.get(next.id)!;
      if (previous.updatedAt.getTime() !== Date.parse(next.expectedUpdatedAt)) {
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      }
    }
    const now = new Date(Math.max(Date.now(),
      ...current.map(sprint => sprint.updatedAt.getTime())) + 1);
    const saved: typeof current = [];

    if (reordered) {
      // All existing sequences are <= maxSequence; use fresh positive temporary
      // numbers to avoid unique-key conflicts during a permutation.
      const temporaryBase = Math.max(...current.map(sprint => sprint.sequence)) + 1;
      for (let index = 0; index < current.length; index += 1) {
        const sprint = current[index]!;
        await tx.update(projectSprints).set({ sequence: temporaryBase + index })
          .where(and(eq(projectSprints.id, sprint.id),
            eq(projectSprints.projectId, scope.project.id)));
      }
    }
    for (let index = 0; index < input.sprints.length; index += 1) {
      const next = input.sprints[index]!;
      const previous = original.get(next.id)!;
      if (!reordered && !changedIds.includes(next.id)) {
        saved.push(previous);
        continue;
      }
      const [updated] = await tx.update(projectSprints).set({
        title: next.title, description: next.description, goal: next.goal,
        definitionOfDone: next.definitionOfDone, startDate: next.startDate,
        endDate: next.endDate, dueDate: next.dueDate,
        ...(reordered ? { sequence: index } : {}),
        updatedAt: now,
      }).where(and(eq(projectSprints.id, next.id),
        eq(projectSprints.projectId, scope.project.id),
        eq(projectSprints.releaseId, release.id))).returning();
      if (!updated) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      saved.push(updated);
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project", subjectId: scope.project.id,
      subjectLabel: input.releaseId, summary: "Project sprint plan saved",
      metadata: { projectId: scope.project.id, releaseId: release.id,
        reordered, editedSprintIds: changedIds, sprintIds: input.sprints.map(row => row.id) },
      groupKey: "project:" + scope.project.id,
      dedupeKey: "project-sprint-plan:" + release.id + ":" + randomUUID(),
    });
    return { changed: true, sprints: saved };
  });
}
