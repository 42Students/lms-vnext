import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectTemplateCollegeAssignments,
  projectTemplates,
  projectTemplateVersions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { collegeIdSchema } from "@/modules/academics/validation";
import { loadProjectCollegeScope } from "./scope";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  createProjectTemplateInputSchema,
  duplicateProjectTemplateInputSchema,
  projectTemplateIdSchema,
  publishableProjectTemplateBlueprintSchema,
  reviseProjectTemplateInputSchema,
  type CreateProjectTemplateInput,
  type DuplicateProjectTemplateInput,
  type ReviseProjectTemplateInput,
} from "./validation";

function mapTemplateConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "project_templates_slug_uq":
      return new ProjectsServiceError(
        "PROJECT_TEMPLATE_SLUG_CONFLICT",
      );
    case "project_template_college_assignments_active_uq":
      return new ProjectsServiceError(
        "PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT",
      );
    default:
      return error;
  }
}

async function loadTemplate(
  templateId: string,
) {
  const [template] = await getDb()
    .select()
    .from(projectTemplates)
    .where(eq(projectTemplates.id, templateId))
    .limit(1);

  if (!template) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_NOT_FOUND",
    );
  }

  return template;
}

async function loadTemplateVersion(
  templateId: string,
  version: number,
) {
  const [templateVersion] = await getDb()
    .select()
    .from(projectTemplateVersions)
    .where(
      and(
        eq(projectTemplateVersions.templateId, templateId),
        eq(projectTemplateVersions.version, version),
      ),
    )
    .limit(1);

  if (!templateVersion) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_VERSION_NOT_FOUND",
    );
  }

  return templateVersion;
}

export async function listProjectTemplates(
  context: RequestContext,
) {
  requirePermission(
    context,
    "project-template.manage",
  );

  return getDb()
    .select()
    .from(projectTemplates)
    .orderBy(asc(projectTemplates.title));
}

export async function getProjectTemplateDetail(
  context: RequestContext,
  templateIdInput: string,
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const template = await loadTemplate(templateId);
  const [versions, assignments] =
    await Promise.all([
      getDb()
        .select()
        .from(projectTemplateVersions)
        .where(
          eq(
            projectTemplateVersions.templateId,
            templateId,
          ),
        )
        .orderBy(
          desc(projectTemplateVersions.version),
        ),
      getDb()
        .select()
        .from(projectTemplateCollegeAssignments)
        .where(
          and(
            eq(
              projectTemplateCollegeAssignments.templateId,
              templateId,
            ),
            isNull(
              projectTemplateCollegeAssignments.revokedAt,
            ),
          ),
        )
        .orderBy(
          asc(
            projectTemplateCollegeAssignments.assignedAt,
          ),
        ),
    ]);

  const currentVersion =
    versions.find(
      (row) =>
        row.version === template.currentVersion,
    ) ?? null;

  return {
    template,
    currentVersion,
    versions,
    assignments,
  };
}

export async function getAssignedProjectTemplateDetail(
  context: RequestContext,
  collegeIdInput: string,
  templateIdInput: string,
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const college =
    await loadProjectCollegeScope(collegeId);

  requirePermission(
    context,
    "projects.manage",
    {
      organizationId: college.organizationId,
      collegeId: college.id,
    },
  );

  const [row] = await getDb()
    .select({
      assignment:
        projectTemplateCollegeAssignments,
      template: projectTemplates,
      version: projectTemplateVersions,
    })
    .from(projectTemplateCollegeAssignments)
    .innerJoin(
      projectTemplates,
      eq(
        projectTemplates.id,
        projectTemplateCollegeAssignments.templateId,
      ),
    )
    .innerJoin(
      projectTemplateVersions,
      eq(
        projectTemplateVersions.id,
        projectTemplateCollegeAssignments.templateVersionId,
      ),
    )
    .where(
      and(
        eq(
          projectTemplateCollegeAssignments.collegeId,
          collegeId,
        ),
        eq(
          projectTemplateCollegeAssignments.templateId,
          templateId,
        ),
        isNull(
          projectTemplateCollegeAssignments.revokedAt,
        ),
        eq(projectTemplates.status, "PUBLISHED"),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_NOT_ASSIGNED",
    );
  }

  return row;
}

export async function createProjectTemplate(
  context: RequestContext,
  rawInput: CreateProjectTemplateInput,
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const input =
    createProjectTemplateInputSchema.parse(rawInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [template] = await tx
        .insert(projectTemplates)
        .values({
          slug: input.slug,
          title: input.title,
          summary: input.summary ?? null,
          createdByUserId: context.user.id,
        })
        .returning();

      if (!template) {
        throw new Error(
          "Project template insert returned no row",
        );
      }

      const [version] = await tx
        .insert(projectTemplateVersions)
        .values({
          templateId: template.id,
          version: 1,
          title: input.title,
          summary: input.summary ?? null,
          blueprint: input.blueprint,
          changeNote: "Initial version",
          createdByUserId: context.user.id,
        })
        .returning();

      return { template, version };
    });
  } catch (error) {
    throw mapTemplateConstraint(error);
  }
}

export async function reviseProjectTemplate(
  context: RequestContext,
  templateIdInput: string,
  rawInput: ReviseProjectTemplateInput,
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const input =
    reviseProjectTemplateInputSchema.parse(rawInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [template] = await tx
        .update(projectTemplates)
        .set({
          title: input.title,
          summary: input.summary ?? null,
          currentVersion: sql`${projectTemplates.currentVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(
          eq(projectTemplates.id, templateId),
        )
        .returning();

      if (!template) {
        throw new ProjectsServiceError(
          "PROJECT_TEMPLATE_NOT_FOUND",
        );
      }

      const [version] = await tx
        .insert(projectTemplateVersions)
        .values({
          templateId,
          version: template.currentVersion,
          title: input.title,
          summary: input.summary ?? null,
          blueprint: input.blueprint,
          changeNote: input.changeNote ?? null,
          createdByUserId: context.user.id,
        })
        .returning();

      return { template, version };
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapTemplateConstraint(error);
  }
}

export async function publishProjectTemplate(
  context: RequestContext,
  templateIdInput: string,
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [template] = await tx
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, templateId))
      .for("update")
      .limit(1);

    if (!template) {
      throw new ProjectsServiceError(
        "PROJECT_TEMPLATE_NOT_FOUND",
      );
    }

    const [version] = await tx
      .select()
      .from(projectTemplateVersions)
      .where(
        and(
          eq(
            projectTemplateVersions.templateId,
            templateId,
          ),
          eq(
            projectTemplateVersions.version,
            template.currentVersion,
          ),
        ),
      )
      .limit(1);

    if (!version) {
      throw new ProjectsServiceError(
        "PROJECT_TEMPLATE_VERSION_NOT_FOUND",
      );
    }

    publishableProjectTemplateBlueprintSchema.parse(
      version.blueprint,
    );

    const now = new Date();
    const [published] = await tx
      .update(projectTemplates)
      .set({
        status: "PUBLISHED",
        publishedVersion:
          template.currentVersion,
        archivedAt: null,
        updatedAt: now,
      })
      .where(
        eq(projectTemplates.id, templateId),
      )
      .returning();

    if (!published) {
      throw new ProjectsServiceError(
        "PROJECT_TEMPLATE_NOT_FOUND",
      );
    }

    // Legacy college assignments point at the template, not a historical
    // version. Existing workspaces stay pinned to their materialized version,
    // but future workspaces in every currently assigned college must use the
    // newly published version without a manual re-assignment step.
    await tx
      .update(
        projectTemplateCollegeAssignments,
      )
      .set({
        templateVersionId: version.id,
      })
      .where(
        and(
          eq(
            projectTemplateCollegeAssignments.templateId,
            templateId,
          ),
          isNull(
            projectTemplateCollegeAssignments.revokedAt,
          ),
        ),
      );

    return published;
  });
}

export async function unpublishProjectTemplate(
  context: RequestContext,
  templateIdInput: string,
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [template] = await tx
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, templateId))
      .for("update")
      .limit(1);

    if (!template) {
      throw new ProjectsServiceError(
        "PROJECT_TEMPLATE_NOT_FOUND",
      );
    }

    const [draft] = await tx
      .update(projectTemplates)
      .set({
        status: "DRAFT",
        publishedVersion: null,
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(
        eq(projectTemplates.id, templateId),
      )
      .returning();

    return draft!;
  });
}

export async function duplicateProjectTemplate(
  context: RequestContext,
  templateIdInput: string,
  rawInput: DuplicateProjectTemplateInput = {},
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const input =
    duplicateProjectTemplateInputSchema.parse(
      rawInput,
    );
  const source = await loadTemplate(templateId);
  const sourceVersion =
    await loadTemplateVersion(
      templateId,
      source.currentVersion,
    );
  const suffix = randomUUID().slice(0, 8);
  const generatedSlug =
    source.slug.slice(0, 49) +
    "-copy-" +
    suffix;
  const slug =
    input.slug ?? generatedSlug;
  const title =
    input.title ??
    (source.title + " Copy").slice(
      0,
      200,
    );
  const summary =
    input.summary ??
    sourceVersion.summary ??
    source.summary ??
    undefined;
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [template] = await tx
        .insert(projectTemplates)
        .values({
          slug,
          title,
          summary: summary ?? null,
          status: "DRAFT",
          currentVersion: 1,
          publishedVersion: null,
          archivedAt: null,
          createdByUserId:
            context.user.id,
        })
        .returning();

      if (!template) {
        throw new Error(
          "Project template duplicate insert returned no row",
        );
      }

      const [version] = await tx
        .insert(projectTemplateVersions)
        .values({
          templateId: template.id,
          version: 1,
          title,
          summary: summary ?? null,
          blueprint:
            sourceVersion.blueprint,
          changeNote:
            "Duplicated from " +
            source.title,
          createdByUserId:
            context.user.id,
        })
        .returning();

      return { template, version };
    });
  } catch (error) {
    throw mapTemplateConstraint(error);
  }
}

export async function archiveProjectTemplate(
  context: RequestContext,
  templateIdInput: string,
) {
  requirePermission(
    context,
    "project-template.manage",
  );
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const template = await loadTemplate(templateId);

  if (template.status === "ARCHIVED") {
    return template;
  }

  const [activeAssignment] = await getDb()
    .select({
      id: projectTemplateCollegeAssignments.id,
    })
    .from(projectTemplateCollegeAssignments)
    .where(
      and(
        eq(
          projectTemplateCollegeAssignments.templateId,
          templateId,
        ),
        isNull(
          projectTemplateCollegeAssignments.revokedAt,
        ),
      ),
    )
    .limit(1);

  if (activeAssignment) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_HAS_ACTIVE_ASSIGNMENTS",
    );
  }

  const now = new Date();
  const [archived] = await getDb()
    .update(projectTemplates)
    .set({
      status: "ARCHIVED",
      archivedAt: now,
      updatedAt: now,
    })
    .where(eq(projectTemplates.id, templateId))
    .returning();

  return archived;
}

export async function assignProjectTemplateToCollege(
  context: RequestContext,
  templateIdInput: string,
  collegeIdInput: string,
) {
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadProjectCollegeScope(collegeId);

  requirePermission(
    context,
    "project-template.assign",
    {
      organizationId: college.organizationId,
      collegeId: college.id,
    },
  );

  const template = await loadTemplate(templateId);
  if (
    template.status !== "PUBLISHED" ||
    template.publishedVersion === null
  ) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_NOT_PUBLISHED",
    );
  }

  const version = await loadTemplateVersion(
    templateId,
    template.publishedVersion,
  );
  const db = getDb();
  const [existing] = await db
    .select()
    .from(projectTemplateCollegeAssignments)
    .where(
      and(
        eq(
          projectTemplateCollegeAssignments.templateId,
          templateId,
        ),
        eq(
          projectTemplateCollegeAssignments.collegeId,
          collegeId,
        ),
        isNull(
          projectTemplateCollegeAssignments.revokedAt,
        ),
      ),
    )
    .limit(1);

  const now = new Date();
  if (existing) {
    const [updated] = await db
      .update(projectTemplateCollegeAssignments)
      .set({
        templateVersionId: version.id,
        assignedByUserId: context.user.id,
        assignedAt: now,
      })
      .where(
        eq(
          projectTemplateCollegeAssignments.id,
          existing.id,
        ),
      )
      .returning();

    return updated;
  }

  try {
    const [created] = await db
      .insert(projectTemplateCollegeAssignments)
      .values({
        templateId,
        templateVersionId: version.id,
        collegeId,
        assignedByUserId: context.user.id,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapTemplateConstraint(error);
  }
}

export async function revokeProjectTemplateFromCollege(
  context: RequestContext,
  templateIdInput: string,
  collegeIdInput: string,
) {
  const templateId =
    projectTemplateIdSchema.parse(templateIdInput);
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadProjectCollegeScope(collegeId);

  requirePermission(
    context,
    "project-template.assign",
    {
      organizationId: college.organizationId,
      collegeId: college.id,
    },
  );

  const [revoked] = await getDb()
    .update(projectTemplateCollegeAssignments)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(
          projectTemplateCollegeAssignments.templateId,
          templateId,
        ),
        eq(
          projectTemplateCollegeAssignments.collegeId,
          collegeId,
        ),
        isNull(
          projectTemplateCollegeAssignments.revokedAt,
        ),
      ),
    )
    .returning();

  if (!revoked) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_ASSIGNMENT_NOT_FOUND",
    );
  }

  return revoked;
}

export async function listAssignedProjectTemplates(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadProjectCollegeScope(collegeId);

  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return getDb()
    .select({
      assignmentId:
        projectTemplateCollegeAssignments.id,
      templateId: projectTemplates.id,
      slug: projectTemplates.slug,
      status: projectTemplates.status,
      version: projectTemplateVersions.version,
      title: projectTemplateVersions.title,
      summary: projectTemplateVersions.summary,
      blueprint: projectTemplateVersions.blueprint,
      assignedAt:
        projectTemplateCollegeAssignments.assignedAt,
    })
    .from(projectTemplateCollegeAssignments)
    .innerJoin(
      projectTemplates,
      eq(
        projectTemplates.id,
        projectTemplateCollegeAssignments.templateId,
      ),
    )
    .innerJoin(
      projectTemplateVersions,
      and(
        eq(
          projectTemplateVersions.id,
          projectTemplateCollegeAssignments
            .templateVersionId,
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
          projectTemplateCollegeAssignments.collegeId,
          collegeId,
        ),
        isNull(
          projectTemplateCollegeAssignments.revokedAt,
        ),
        eq(projectTemplates.status, "PUBLISHED"),
      ),
    )
    .orderBy(asc(projectTemplateVersions.title));
}
