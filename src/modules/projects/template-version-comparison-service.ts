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
  return { template, selected, current,
    changes: compareTemplateVersionSnapshots(current, selected) };
}
