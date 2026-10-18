import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  colleges,
  projectTemplateCollegeAssignments,
  projectTemplateVersions,
  projectTemplates,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { projectTemplateIdSchema } from "./validation";
import { ProjectsServiceError } from "./errors";

/**
 * Global Super Admin template inspection, with or without a selected safety scope.
 *
 * A dedicated centrally defined read permission allows active Super Admins
 * in every scope. Global template mutations remain unscoped-only.
 *
 * This service performs reads only. It does not expose
 * template, assignment, or version mutation functions.
 */
export async function getSuperAdminTemplateSubview(
  context: RequestContext,
  templateId: string,
  includeColleges = false,
) {
  requirePermission(
    context,
    "project-template.read",
  );

  const id = projectTemplateIdSchema.parse(templateId);
  const db = getDb();
  const [template] = await db.select().from(projectTemplates)
    .where(eq(projectTemplates.id, id)).limit(1);
  if (!template) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
  // A non-history tab only needs the current blueprint. Historical versions
  // can number in the thousands; never load them into every admin tab.
  const [currentVersion] = await db.select().from(projectTemplateVersions)
    .where(and(eq(projectTemplateVersions.templateId, id),
      eq(projectTemplateVersions.version, template.currentVersion))).limit(1);

  const assignedColleges = includeColleges
    ? await getDb()
        .select({
          assignmentId:
            projectTemplateCollegeAssignments.id,
          collegeId: colleges.id,
          collegeName: colleges.name,
          collegeCode: colleges.code,
          collegeStatus: colleges.status,
          assignedVersion:
            projectTemplateVersions.version,
          assignedAt:
            projectTemplateCollegeAssignments.assignedAt,
          assignedByUserId:
            projectTemplateCollegeAssignments.assignedByUserId,
        })
        .from(projectTemplateCollegeAssignments)
        .innerJoin(
          colleges,
          eq(
            colleges.id,
            projectTemplateCollegeAssignments.collegeId,
          ),
        )
        .leftJoin(
          projectTemplateVersions,
          and(
            eq(
              projectTemplateVersions.id,
              projectTemplateCollegeAssignments.templateVersionId,
            ),
            eq(
              projectTemplateVersions.templateId,
              projectTemplateCollegeAssignments.templateId,
            ),
          ),
        )
        .where(
          and(
            eq(
              projectTemplateCollegeAssignments.templateId,
              template.id,
            ),
            isNull(projectTemplateCollegeAssignments.revokedAt),
            context.adminScope?.collegeId ? eq(colleges.id, context.adminScope.collegeId) : undefined,
            context.adminScope?.organizationId ? eq(colleges.organizationId, context.adminScope.organizationId) : undefined,
          ),
        )
        .orderBy(
          asc(colleges.name),
          asc(colleges.id),
        )
    : [];

  return {
    template,
    currentVersion: currentVersion ?? null,
    versions: [],
    assignments: [],
    assignedColleges,
  };
}
