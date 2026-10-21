import { getDb } from "@/db/client";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { legacyIdMap, projectTemplates } from "@/db/schema";
import { ProjectsServiceError } from "./errors";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listColleges } from "@/modules/colleges/service";
import { getSuperAdminTemplateSubview } from "./template-subview-service";
import { projectTemplateCollegeAvailability, templateCollegeAvailabilityQuerySchema, templateAvailabilityCollegesInScope } from "./template-college-availability-model";
/** Legacy getColleges/getProjectTemplateById/assign/unassign/bulkSet are
 * split between scoped reads and persisted mutation services. Missing
 * assignment storage is UNKNOWN, never "not assigned". */
export const legacyTemplateCollegeAvailabilityContract={
 reads:["listColleges","getSuperAdminTemplateSubview"],
 writes:["assign","unassign","bulkSet"],
 knownOnlyAfter:["template","collegeDirectory","assignmentRows"],
 draftAssignment:"Requires published template and authorized college scope",
} as const;
export class TemplateCollegeReadError extends Error {
  constructor(readonly source: "TEMPLATE" | "ASSIGNMENTS") {
    super(source === "TEMPLATE" ? "Template could not be loaded" : "College assignments could not be loaded");
    this.name = "TemplateCollegeReadError";
  }
}

/** Import crosswalk supports old numeric IDs and stable slugs without guessing a UUID. */
export async function resolveTemplateCollegeLegacyId(context: RequestContext, source: string) {
  requirePermission(context, "project-template.read");
  const value=source.trim();
  const normalized = /^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(value);
  if (normalized) return value;
  if (value.length===0 || value.length>96 || !/^[a-z0-9_-]+$/i.test(value))
    throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
  const db=getDb();
  if (/^[0-9]+$/.test(value)) {
    const [mapped]=await db.select({id:legacyIdMap.newId}).from(legacyIdMap)
      .where(and(eq(legacyIdMap.legacyEntityType,"project_template"),
        eq(legacyIdMap.legacyId,value),
        eq(legacyIdMap.newEntityType,"project_template"),
        isNull(legacyIdMap.collegeId))).limit(1);
    if(mapped) return mapped.id;
  }
  const [template]=await db.select({id:projectTemplates.id}).from(projectTemplates)
    .where(ilike(projectTemplates.slug,value)).limit(1);
  if (!template) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
  return template.id;
}

export async function listSuperAdminTemplateCollegeAvailability(context: RequestContext, templateId: string, rawQuery: unknown) {
  requirePermission(context, "project-template.read");
  const query = templateCollegeAvailabilityQuerySchema.parse(rawQuery);
  const canonicalId=await resolveTemplateCollegeLegacyId(context,templateId);
  let detail: Awaited<ReturnType<typeof getSuperAdminTemplateSubview>>;
  try {
    detail=await getSuperAdminTemplateSubview(context, canonicalId, true);
  } catch (error) {
    if (error instanceof ProjectsServiceError && error.code === "PROJECT_TEMPLATE_NOT_FOUND") throw error;
    throw new TemplateCollegeReadError("TEMPLATE");
  }
  let colleges: Awaited<ReturnType<typeof listColleges>>;
  try {
    colleges=await listColleges(context);
  } catch {
    throw new TemplateCollegeReadError("ASSIGNMENTS");
  }
  // Both reads must succeed: never treat a failed assignment request as an empty list.
  const verified=projectTemplateCollegeAvailability(templateAvailabilityCollegesInScope(
    colleges,context.adminScope??null,isSuperAdmin(context)),detail.assignedColleges,query);
  return {template:detail.template,...verified,
    assignmentReadState:"VERIFIED" as const,
    draftAssignmentForbidden:detail.template.status!=="PUBLISHED",
  };
}
