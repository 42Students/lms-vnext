import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectInstances } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { loadProjectCollegeScope } from "./scope";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectArchiveTokenMatches } from "./instance-archive-model";
import { projectSoftDeleteInputSchema } from "./project-soft-delete-model";

/** Deleted workspaces are retained for recovery and audit, never hard-deleted. */
export async function listSoftDeletedProjectWorkspaces(context: RequestContext, collegeId: string) {
  const college = await loadProjectCollegeScope(collegeId);
  requirePermission(context, "projects.manage", {
    collegeId: college.id, organizationId: college.organizationId,
  });
  return getDb().select({
    id: projectInstances.id, title: projectInstances.title,
    status: projectInstances.status, deletedAt: projectInstances.deletedAt,
    updatedAt: projectInstances.updatedAt,
  }).from(projectInstances).where(and(
    eq(projectInstances.collegeId, college.id),
    isNotNull(projectInstances.deletedAt),
  )).orderBy(asc(projectInstances.title), asc(projectInstances.id)).limit(200);
}

export async function changeProjectSoftDeleteState(
  context: RequestContext,
  projectId: string,
  raw: unknown,
  restore: boolean,
) {
  const input = projectSoftDeleteInputSchema.parse(raw);
  const scope = await requireProjectManageAccess(context, projectId, { includeDeleted: restore });
  return getDb().transaction(async tx => {
    const [project] = await tx.select().from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId, scope.collegeId)))
      .for("update").limit(1);
    if (!project) throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    await assertPersistedPlatformPermission(tx, context, "projects.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });
    if (Boolean(project.deletedAt) !== restore) {
      // Idempotent after authorizing the live actor; no duplicate audit event.
      return { changed: false, project };
    }
    if (!projectArchiveTokenMatches(project.updatedAt, input.expectedUpdatedAt)) {
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    }
    const now = new Date(Math.max(Date.now(), project.updatedAt.getTime()) + 1);
    const [updated] = await tx.update(projectInstances).set(
      restore
        ? { deletedAt: null, updatedAt: now }
        : { deletedAt: now, status: "ARCHIVED",
            archivedAt: project.archivedAt ?? now, updatedAt: now },
    ).where(and(eq(projectInstances.id, project.id),
      eq(projectInstances.collegeId, scope.collegeId))).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    await recordActivityEventInTransaction(tx, context, {
      eventType: restore
        ? ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_RESTORED
        : ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_DELETED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "project", subjectId: project.id, subjectLabel: project.title,
      summary: restore ? "Deleted workspace restored" : "Workspace moved to Deleted workspaces",
      metadata: { projectId: project.id, previousStatus: project.status,
        previousDeletedAt: project.deletedAt?.toISOString() ?? null,
        status: updated.status, softDeleted: Boolean(updated.deletedAt) },
      groupKey: "project:" + project.id,
      dedupeKey: "project:soft-delete:" + project.id + ":" + now.toISOString(),
    });
    return { changed: true, project: updated };
  });
}
