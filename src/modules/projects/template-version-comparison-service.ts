import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "./errors";
import { getProjectTemplateDetail } from "./template-service";
import { compareTemplateVersionSnapshots, templateVersionComparisonParamsSchema } from "./template-version-comparison-model";

export async function getSuperAdminTemplateVersionComparison(context: RequestContext, rawParams: unknown) {
  requirePermission(context, "project-template.read");
  const { templateId, versionId } = templateVersionComparisonParamsSchema.parse(rawParams);
  const detail = await getProjectTemplateDetail(context, templateId);
  // Resolve only inside the authorized template; a UUID from another template is indistinguishable from absence.
  const selected = detail.versions.find(version => version.id === versionId);
  if (!selected || !detail.currentVersion) {
    throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
  }
  return { template: detail.template, selected, current: detail.currentVersion,
    changes: compareTemplateVersionSnapshots(detail.currentVersion, selected) };
}
