import { and, eq, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectTemplates, projectTemplateVersions } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "./errors";
import { compareTemplateVersionSnapshots, templateVersionComparisonParamsSchema } from "./template-version-comparison-model";

export async function getSuperAdminTemplateVersionComparison(context: RequestContext, rawParams: unknown) {
  requirePermission(context, "project-template.read");
  const { templateId, versionId } = templateVersionComparisonParamsSchema.parse(rawParams);
  const db = getDb();
  const [template] = await db.select().from(projectTemplates)
    .where(eq(projectTemplates.id, templateId)).limit(1);
  if (!template) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");

  // Comparing one historical snapshot with the current one must not load
  // every version or college assignment. A template can accumulate thousands
  // of large blueprint versions over multiple academic years.
  const versions = await db.select().from(projectTemplateVersions).where(and(
    eq(projectTemplateVersions.templateId, templateId),
    or(eq(projectTemplateVersions.id, versionId),
      eq(projectTemplateVersions.version, template.currentVersion)),
  )).limit(2);
  const selected = versions.find(version => version.id === versionId && version.templateId === templateId);
  const current = versions.find(version => version.version === template.currentVersion && version.templateId === templateId);
  if (!selected || !current) {
    throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
  }
  // The comparison intentionally lives on an addressable read-only page,
  // rather than a non-bookmarkable modal. The page preserves keyboard
  // navigation, close/back semantics and side-by-side changed fields.
  const changes=compareTemplateVersionSnapshots(current,selected);
  return {template,selected,current,changes,
    presentation:{
      kind:"ACCESSIBLE_PAGE" as const,
      heading:`Compare version ${selected.version} with current version ${current.version}`,
      backHref:`/admin/projects/templates/${template.id}/versions`,
      warning:"Versions are read-only; restoring a snapshot creates a new version.",
      changedFieldCount:changes.length,
    },
  };
}
