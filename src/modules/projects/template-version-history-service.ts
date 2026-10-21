import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectTemplates, projectTemplateVersions } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { ProjectsServiceError } from "./errors";
import { projectTemplateIdSchema } from "./validation";
import { TEMPLATE_VERSION_HISTORY_PAGE_SIZE, templateVersionHistoryPage, templateVersionHistoryQuerySchema } from "./template-version-history-model";
export async function getSuperAdminTemplateVersionHistory(context: RequestContext, rawId: string, rawQuery: unknown) {
  requirePermission(context, "project-template.read");
  const id = projectTemplateIdSchema.parse(rawId);
  const query = templateVersionHistoryQuerySchema.parse(rawQuery);
  const db = getDb();
  const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id)).limit(1);
  if (!template) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
  const [totals] = await db.select({ total: count() }).from(projectTemplateVersions)
    .where(eq(projectTemplateVersions.templateId, id));
  const paging = templateVersionHistoryPage(totals?.total ?? 0, query.page);
  const [versions, currentRows] = await Promise.all([
    db.select().from(projectTemplateVersions).where(eq(projectTemplateVersions.templateId, id))
      .orderBy(desc(projectTemplateVersions.version), desc(projectTemplateVersions.id))
      .limit(TEMPLATE_VERSION_HISTORY_PAGE_SIZE).offset(paging.offset),
    db.select().from(projectTemplateVersions).where(and(eq(projectTemplateVersions.templateId, id),
      eq(projectTemplateVersions.version, template.currentVersion))).limit(1),
  ]);
  // History contains global template metadata, never college-assignment identifiers or contacts.
  return { message:"Project template versions retrieved",paging, detail: { template, versions, currentVersion: currentRows[0] ?? null, assignments: [], assignedColleges: [] } };
}
