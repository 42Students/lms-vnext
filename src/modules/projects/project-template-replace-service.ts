import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectInstances, projectTemplateCollegeAssignments, projectTemplates,
  projectTemplateVersions, projectReleases, projectSprints, projectTasks,
  projectResources, projectSubmissions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { requireProjectManageAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectArchiveTokenMatches } from "./instance-archive-model";
import { replaceProjectTemplateSchema } from "./project-template-replace-model";
import { parseWorkspaceBrief } from "./workspace-brief-model";
import { publishableProjectTemplateBlueprintSchema } from "./validation";

/** Search is filtered in SQL, not after loading all published template blueprints. */
export async function searchWorkspaceAssignedTemplates(
  context: RequestContext, projectId: string, rawSearch: string,
) {
  const scope = await requireProjectManageAccess(context, projectId);
  const search = rawSearch.trim().slice(0, 100);
  const pattern = "%" + search.replace(/[\\%_]/g, "\\$&") + "%";
  const options = await getDb().select({
    templateId: projectTemplates.id,
    title: projectTemplateVersions.title,
    version: projectTemplateVersions.version,
  }).from(projectTemplateCollegeAssignments)
    .innerJoin(projectTemplates,
      eq(projectTemplates.id, projectTemplateCollegeAssignments.templateId))
    .innerJoin(projectTemplateVersions, and(
      eq(projectTemplateVersions.id, projectTemplateCollegeAssignments.templateVersionId),
      eq(projectTemplateVersions.templateId, projectTemplates.id),
    ))
    .where(and(
      eq(projectTemplateCollegeAssignments.collegeId, scope.collegeId),
      isNull(projectTemplateCollegeAssignments.revokedAt),
      eq(projectTemplates.status, "PUBLISHED"),
      search ? or(ilike(projectTemplateVersions.title, pattern),
        ilike(projectTemplates.slug, pattern)) : undefined,
    ))
    .orderBy(asc(projectTemplateVersions.title), asc(projectTemplates.id))
    .limit(50);
  return options;
}

function isForeignKeyError(error: unknown) {
  let cause: unknown = error;
  for (let i = 0; i < 5; i += 1) {
    if (!cause || typeof cause !== "object") return false;
    if ("code" in cause && (cause as { code?: unknown }).code === "23503") return true;
    cause = "cause" in cause ? (cause as { cause?: unknown }).cause : null;
  }
  return false;
}

/** Replacing a published template regenerates only the template-owned plan.
 * Existing members, meetings, executions, reviews and uploads are never reassigned.
 * FK references or non-PLANNED execution prevent replacement; the whole change
 * rolls back instead of orphaning records or silently dropping submissions.
 */
export async function replaceProjectWorkspaceTemplate(
  context: RequestContext, projectId: string, raw: unknown,
) {
  const input = replaceProjectTemplateSchema.parse(raw);
  const scope = await requireProjectManageAccess(context, projectId);
  try {
    return await getDb().transaction(async tx => {
      const [project] = await tx.select().from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId, scope.collegeId)))
        .for("update").limit(1);
      if (!project || project.deletedAt ||
        !["PLANNED", "ACTIVE"].includes(project.status)) {
        throw new ProjectsServiceError("PROJECT_TEMPLATE_INVALID_STATE");
      }
      await assertPersistedPlatformPermission(tx, context, "projects.manage", {
        collegeId: scope.collegeId, organizationId: scope.organizationId,
      });
      if (!projectArchiveTokenMatches(project.updatedAt, input.expectedUpdatedAt)) {
        throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
      }
      const [assigned] = await tx.select({
        templateId: projectTemplates.id,
        templateVersionId: projectTemplateVersions.id,
        summary: projectTemplateVersions.summary,
        blueprint: projectTemplateVersions.blueprint,
      }).from(projectTemplateCollegeAssignments)
        .innerJoin(projectTemplates, eq(projectTemplates.id, projectTemplateCollegeAssignments.templateId))
        .innerJoin(projectTemplateVersions, and(
          eq(projectTemplateVersions.id, projectTemplateCollegeAssignments.templateVersionId),
          eq(projectTemplateVersions.templateId, projectTemplates.id),
        ))
        .where(and(
          eq(projectTemplateCollegeAssignments.collegeId, scope.collegeId),
          eq(projectTemplateCollegeAssignments.templateId, input.templateId),
          isNull(projectTemplateCollegeAssignments.revokedAt),
          eq(projectTemplates.status, "PUBLISHED"),
        )).for("share").limit(1);
      if (!assigned) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_ASSIGNED");
      if (project.templateVersionId === assigned.templateVersionId) {
        return { changed: false };
      }
      const blueprint = publishableProjectTemplateBlueprintSchema.parse(assigned.blueprint);
      // Hold all dependent rows until commit. Concurrent lifecycle operations
      // obtain the parent lock, and these locks also protect raw FK references.
      const releases = await tx.select().from(projectReleases)
        .where(eq(projectReleases.projectId, project.id)).for("update");
      const sprints = await tx.select().from(projectSprints)
        .where(eq(projectSprints.projectId, project.id)).for("update");
      const tasks = await tx.select().from(projectTasks)
        .where(eq(projectTasks.projectId, project.id)).for("update");
      const resources = await tx.select().from(projectResources)
        .where(eq(projectResources.projectId, project.id)).for("update");
      // Final deliveries refer to the workspace, not individual task IDs.
      // A foreign key would not prevent losing their meaning on replacement.
      const [submission] = await tx.select({ id: projectSubmissions.id })
        .from(projectSubmissions).where(eq(projectSubmissions.projectId, project.id))
        .limit(1);
      if (submission || releases.some(row => row.status !== "PLANNED") ||
        sprints.some(row => row.status !== "PLANNED") ||
        tasks.some(row => row.status !== "TODO" || row.assigneeMembershipId !== null)) {
        throw new ProjectsServiceError("PROJECT_TEMPLATE_INVALID_STATE");
      }
      // FK restrictions on task submissions, meeting links, attached files,
      // resource references and any other preserved evidence are fail-closed.
      await tx.delete(projectTasks).where(eq(projectTasks.projectId, project.id));
      await tx.delete(projectSprints).where(eq(projectSprints.projectId, project.id));
      await tx.delete(projectReleases).where(eq(projectReleases.projectId, project.id));
      await tx.delete(projectResources).where(eq(projectResources.projectId, project.id));

      const newReleases = await tx.insert(projectReleases).values(
        [...blueprint.releases].sort((a, b) => a.sequence - b.sequence).map(row => ({
          projectId: project.id, templateKey: row.key,
          title: row.title, description: row.description ?? null, sequence: row.sequence,
        })),
      ).returning({ id: projectReleases.id, key: projectReleases.templateKey });
      const releaseIds = new Map(newReleases.map(row => [row.key, row.id]));
      const newSprints = await tx.insert(projectSprints).values(
        [...blueprint.sprints].sort((a, b) => a.sequence - b.sequence).map(row => ({
          projectId: project.id, releaseId: releaseIds.get(row.releaseKey)!,
          templateKey: row.key, title: row.title, description: row.description ?? null,
          goal: row.goal ?? null, dueLabel: row.dueLabel ?? null, sequence: row.sequence,
        })),
      ).returning({ id: projectSprints.id, key: projectSprints.templateKey });
      const sprintIds = new Map(newSprints.map(row => [row.key, row.id]));
      if(blueprint.tasks.length)await tx.insert(projectTasks).values(
        [...blueprint.tasks].sort((a, b) => a.sequence - b.sequence).map(row => {
          const sprintId=row.sprintKey?sprintIds.get(row.sprintKey):null;
          if(row.sprintKey&&!sprintId)throw new Error("Template task has unknown sprint");
          return {
            projectId:project.id,sprintId,templateKey:row.key,
            legacyTaskKey:row.legacyKey??null,title:row.title,
            description:row.description??null,
            dueLabel:row.dueLabel??null,approach:row.approach??null,
            taskType:row.taskType??null,acceptanceCriteria:row.acceptanceCriteria??null,
            priority:row.priority,estimatePoints:row.estimatePoints??null,sequence:row.sequence,
          };
        }),
      );
      if (blueprint.resources.length) {
        await tx.insert(projectResources).values(
          [...blueprint.resources].sort((a, b) => a.sequence - b.sequence).map(row => ({
            projectId: project.id, templateKey: row.key, title: row.title,
            description: row.description ?? null, url: row.url ?? null,
            required: row.required, sequence: row.sequence,
          })),
        );
      }

      const brief = parseWorkspaceBrief(project.authoredBrief);
      const emptyBrief = !brief.goal && !brief.description &&
        brief.deliverables.length === 0 && brief.completionConditions.length === 0 &&
        brief.personas.length === 0;
      const overview = blueprint.overview;
      const [updated] = await tx.update(projectInstances).set({
        templateId: assigned.templateId,
        templateVersionId: assigned.templateVersionId,
        ...(input.reapplyDefaults ? {
          summary: project.summary?.trim() ? project.summary : assigned.summary,
          phase: project.phase?.trim() ? project.phase : (overview.phase ?? null),
          courseLabel: project.courseLabel?.trim() ? project.courseLabel : (overview.courseLabel ?? null),
          ...(emptyBrief ? { authoredBrief: {
            goal: overview.goal ?? "", description: overview.description ?? "",
            deliverables: overview.deliverables ?? [],
            completionConditions: overview.definitionOfDone ?? [],
            personas: overview.personas ?? [],
          }} : {}),
        } : {}),
        updatedAt: new Date(Math.max(Date.now(), project.updatedAt.getTime()) + 1),
      }).where(and(eq(projectInstances.id, project.id),
        eq(projectInstances.collegeId, scope.collegeId))).returning();
      if (!updated) throw new ProjectsServiceError("PROJECT_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_SUMMARY_UPDATED,
        collegeId: scope.collegeId, organizationId: scope.organizationId,
        subjectType: "project", subjectId: project.id, subjectLabel: project.title,
        summary: "Workspace template replaced",
        metadata: { projectId: project.id, previousTemplateId: project.templateId,
          previousTemplateVersionId: project.templateVersionId,
          templateId: assigned.templateId, templateVersionId: assigned.templateVersionId,
          reapplyDefaults: input.reapplyDefaults,
          replacedCounts: { releases: releases.length, sprints: sprints.length,
            tasks: tasks.length, resources: resources.length } },
        groupKey: "project:" + project.id,
        dedupeKey: "project:template-replace:" + project.id + ":" + randomUUID(),
      });
      return { changed: true, project: updated };
    });
  } catch (error) {
    if (isForeignKeyError(error)) {
      throw new ProjectsServiceError("PROJECT_TEMPLATE_INVALID_STATE");
    }
    throw error;
  }
}
