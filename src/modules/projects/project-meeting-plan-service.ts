import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances, projectMeetings, projectSprints, projectTasks } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectMeetingPlanFieldsChanged, projectMeetingPlanSchema } from "./project-meeting-plan-model";
import { projectMeetingPlanToken } from "./project-meeting-plan-token";
import { isFutureProjectMeetingWindow } from "./meeting-window-policy";

/** Single atomic save of changed DRAFT meetings only. Scheduling, invitations,
 * meeting outcomes and cancellation remain in the existing lifecycle service.
 */
export async function saveProjectMeetingPlan(context: RequestContext, projectId: string, raw: unknown) {
  const input = projectMeetingPlanSchema.parse(raw);
  const scope = await requireProjectManageAccess(context, projectId);
  return getDb().transaction(async tx => {
    const [project] = await tx.select({ id: projectInstances.id, status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId, scope.collegeId)))
      .for("update").limit(1);
    if (!project || !["PLANNED", "ACTIVE"].includes(project.status)) {
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    }
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });

    const current = await tx.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, scope.project.id))
      .orderBy(asc(projectMeetings.id)).for("update");
    if (projectMeetingPlanToken(current) !== input.expectedMeetingsToken) {
      throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
    }
    const byId = new Map(current.map(row => [row.id, row]));
    const updates = input.meetings.map(next => ({ next, prior: byId.get(next.id) }));
    if (updates.some(({ prior }) => !prior || prior.deletedAt || prior.status !== "DRAFT")) {
      throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
    }
    const changed = updates.filter(({ prior, next }) =>
      projectMeetingPlanFieldsChanged(prior!, next));
    if (!changed.length) {
      return { changed: false, meetingIds: [], meetingsToken: input.expectedMeetingsToken };
    }
    const nowMs = Date.now();
    const [sprints, tasks] = await Promise.all([
      tx.select({ id: projectSprints.id }).from(projectSprints)
        .where(eq(projectSprints.projectId, scope.project.id)),
      tx.select({ id: projectTasks.id, sprintId: projectTasks.sprintId,
        deletedAt: projectTasks.deletedAt }).from(projectTasks)
        .where(eq(projectTasks.projectId, scope.project.id)),
    ]);
    const sprintIds = new Set(sprints.map(sprint => sprint.id));
    const taskById = new Map(tasks.map(task => [task.id, task]));
    for (const { next } of changed) {
      if (!isFutureProjectMeetingWindow(new Date(next.startsAt), new Date(next.endsAt), nowMs)) {
        throw new ProjectsServiceError("PROJECT_MEETING_INVALID_STATE");
      }
      const linkedTask = next.linkedTaskId ? taskById.get(next.linkedTaskId) : null;
      if ((next.linkedSprintId && !sprintIds.has(next.linkedSprintId)) ||
        (next.linkedTaskId && (!linkedTask || linkedTask.deletedAt)) ||
        (next.linkedSprintId && linkedTask && linkedTask.sprintId !== next.linkedSprintId)) {
        throw new ProjectsServiceError("PROJECT_MEETING_LINK_INVALID");
      }
    }
    const updatedAt = new Date(Math.max(nowMs, ...current.map(row => row.updatedAt.getTime())) + 1);
    const meetingIds: string[] = [];
    for (const { prior, next } of changed) {
      const [saved] = await tx.update(projectMeetings).set({
        title: next.title, agenda: next.agenda, startsAt: new Date(next.startsAt),
        endsAt: new Date(next.endsAt), linkedSprintId: next.linkedSprintId,
        linkedTaskId: next.linkedTaskId, updatedAt, version: prior!.version + 1,
      }).where(and(eq(projectMeetings.id, next.id),
        eq(projectMeetings.projectId, scope.project.id),
        eq(projectMeetings.status, "DRAFT"))).returning({ id: projectMeetings.id });
      if (!saved) throw new ProjectsServiceError("PROJECT_MEETING_STALE_VERSION");
      meetingIds.push(saved.id);
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_MEETING_DECIDED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project", subjectId: scope.project.id,
      subjectLabel: scope.project.title, summary: "Draft meeting plan saved",
      metadata: { projectId: scope.project.id, meetingIds, status: "DRAFT", draftOnly: true },
      groupKey: "project:" + scope.project.id + ":meetings",
      dedupeKey: "project-meeting-plan:" + scope.project.id + ":" + randomUUID(),
    });
    const persisted = await tx.select().from(projectMeetings)
      .where(eq(projectMeetings.projectId, scope.project.id));
    return { changed: true, meetingIds, meetingsToken: projectMeetingPlanToken(persisted) };
  });
}
