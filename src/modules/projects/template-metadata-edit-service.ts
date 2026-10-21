import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { projectTemplates, projectTemplateVersions } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { ProjectsServiceError } from "./errors";
import { templateMetadataEditSchema, templateMetadataEditDecision } from "./template-metadata-edit-model";
export async function editSuperAdminTemplateMetadata(context: RequestContext, rawId: unknown, rawInput: unknown) {
  requirePermission(context, "project-template.manage");
  const id = z.uuid().parse(rawId);
  const input = templateMetadataEditSchema.parse(rawInput);
  return getDb().transaction(async tx => {
    const [locked] = await tx.select({ template: projectTemplates,
      timestampMatches: sql<boolean>`date_trunc('milliseconds', ${projectTemplates.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`.as("template_token_matches"),
    }).from(projectTemplates).where(eq(projectTemplates.id, id)).for("update").limit(1);
    if (!locked) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    // The request context can outlive a role or session revocation. The
    // persisted actor must still have platform-level template management
    // authority while this parent-row-locked write is in progress.
    await assertPersistedPlatformPermission(tx, context, "project-template.manage");
    const decision = templateMetadataEditDecision(locked.template, input, locked.timestampMatches);
    if (decision) throw new ProjectsServiceError(decision);
    const [current] = await tx.select().from(projectTemplateVersions).where(and(
      eq(projectTemplateVersions.templateId, id), eq(projectTemplateVersions.version, locked.template.currentVersion),
    )).limit(1);
    if (!current) throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
    const now = new Date(Math.max(Date.now(), locked.template.updatedAt.getTime() + 1));
    const [updated] = await tx.update(projectTemplates).set({
      title:input.title,summary:input.summary,
      slug:input.slug??locked.template.slug,
      legacyCourseLabel:input.courseLabel??locked.template.legacyCourseLabel,
      legacyPhase:input.phase??locked.template.legacyPhase,
      currentVersion: locked.template.currentVersion + 1, updatedAt: now,
    }).where(and(eq(projectTemplates.id, id), eq(projectTemplates.status, "DRAFT"),
      eq(projectTemplates.currentVersion, input.expectedCurrentVersion),
      sql`date_trunc('milliseconds', ${projectTemplates.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
    )).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
    const [version] = await tx.insert(projectTemplateVersions).values({ templateId: id, version: updated.currentVersion,
      title:updated.title,summary:updated.summary,
      blueprint:{
        ...current.blueprint,
        overview:{
         ...current.blueprint.overview,
         ...(input.overview??{}),
         ...(input.courseLabel!==undefined?{courseLabel:input.courseLabel}:{}),
         ...(input.phase!==undefined?{phase:input.phase}:{}),
        },
      },
      changeNote:input.changeNote,
      createdByUserId: context.user.id }).returning();
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_METADATA_UPDATED,
      subjectType: "project_template", subjectId: id, subjectLabel: updated.title,
      summary: "Draft project template metadata revised",
      metadata: { previousVersion: locked.template.currentVersion, newVersion: updated.currentVersion,
        titleChanged: locked.template.title !== updated.title, summaryChanged: locked.template.summary !== updated.summary,
        changeNote: input.changeNote }, groupKey: "template:" + id,
    });
    return { template: updated, version };
  });
}
