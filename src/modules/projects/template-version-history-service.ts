import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectTemplates, projectTemplateVersions, projectTemplateLegacyEvents } from "@/db/schema";
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
      .orderBy(desc(projectTemplateVersions.version), desc(projectTemplateVersions.createdAt), desc(projectTemplateVersions.id))
      .limit(TEMPLATE_VERSION_HISTORY_PAGE_SIZE).offset(paging.offset),
    db.select().from(projectTemplateVersions).where(and(eq(projectTemplateVersions.templateId, id),
      eq(projectTemplateVersions.version, template.currentVersion))).limit(1),
  ]);
  // The legacy backend retained multiple action revisions for the same
  // templateVersion. Do not try to make these immutable vNext versions:
  // the unique(template_id,version) ledger represents executable snapshots.
  // Show a bounded source-action chronology separately, with changedAt
  // breaking ties before the original append-only UUID.
  const legacyEvents = await db.select({
    id: projectTemplateLegacyEvents.id,
    legacyTemplateVersion: projectTemplateLegacyEvents.legacyTemplateVersion,
    actionType: projectTemplateLegacyEvents.actionType,
    lifecycleStatus: projectTemplateLegacyEvents.lifecycleStatus,
    sourceActorName: projectTemplateLegacyEvents.sourceActorName,
    changedAt: projectTemplateLegacyEvents.changedAt,
    notes: projectTemplateLegacyEvents.notes,
  }).from(projectTemplateLegacyEvents)
    .where(eq(projectTemplateLegacyEvents.templateId,id))
    .orderBy(desc(projectTemplateLegacyEvents.legacyTemplateVersion),
      desc(projectTemplateLegacyEvents.changedAt),
      desc(projectTemplateLegacyEvents.id))
    .limit(51).then(rows=>({
      rows:rows.slice(0,50),truncated:rows.length>50,
    })).catch(()=>null);
  // Global templates are platform-owned, never scoped to a college:
  // project-template.read requires Super Admin even while acting in college.
  // Assignment and rollback impact must be checked on the comparison route
  // before a version is restored, never inferred from this overview.
  // History contains global template metadata, never college-assignment identifiers or contacts.
  return {
    message:"Project template versions retrieved",
    paging,
    readContract:{
      currentEndpoint:"/api/projects/templates/"+encodeURIComponent(id)+"/versions",
      legacyPageSize:25,legacySummaryCap:50,
      scope:"GLOBAL_SUPER_ADMIN" as const,
      rollbackRequiresImpactPreview:true,
    },
    detail:{
      template, versions, currentVersion:currentRows[0]??null,
      // Read-only history never implicitly enumerates tenant assignments.
      assignments:[],assignedColleges:[],
      legacyEvents:legacyEvents?.rows??null,
      legacyEventsTruncated:legacyEvents?.truncated??false,
      legacyEventsAvailable:legacyEvents!==null,
    },
  };
}
