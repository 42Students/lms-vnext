import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  isNotNull,
  inArray,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {
  projectTemplateCollegeAssignments,
  projectTemplates,
  projectTemplateVersions,
  legacyIdMap,
  colleges,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
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

export type ProjectTemplateCatalogFilter="ALL"|"ACTIVE"|"DRAFT"|"PUBLISHED"|"ARCHIVED";
/** A global read shows full history by default. Catalog tabs may opt in to
 * the historic active/published filters without silently hiding audits. */
export async function listProjectTemplates(
  context: RequestContext,
  filter:ProjectTemplateCatalogFilter="ALL",
) {
  requirePermission(
    context,
    "project-template.read",
  );

  const predicate=filter==="ACTIVE"?isNull(projectTemplates.archivedAt)
    :filter==="ALL"?undefined:eq(projectTemplates.status,filter);
  return getDb().select().from(projectTemplates)
    .where(predicate).orderBy(asc(projectTemplates.title),asc(projectTemplates.id));
}

/** Historic slug/numeric links must resolve under a verified global
 * template read grant. Tenant-specific mappings cannot leak global IDs.
 */
export async function resolveLegacyProjectTemplateBookmark(
 context:RequestContext,raw:string,
):Promise<string|null>{
 requirePermission(context,"project-template.read");
 const value=raw.trim();
 if(!value||value.length>96)return null;
 const uuid=projectTemplateIdSchema.safeParse(value);
 if(uuid.success)return uuid.data;
 if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)&&!/^[0-9]+$/.test(value)){
   const [row]=await getDb().select({id:projectTemplates.id})
    .from(projectTemplates)
    .where(sql`lower(${projectTemplates.slug}) = ${value.toLowerCase()}`)
    .limit(1);
   return row?.id??null;
 }
 if(!/^[1-9][0-9]{0,9}$/.test(value))return null;
 const rows=await getDb().select({id:projectTemplates.id})
   .from(legacyIdMap)
   .innerJoin(projectTemplates,eq(projectTemplates.id,legacyIdMap.newId))
   .where(and(isNull(legacyIdMap.collegeId),
     inArray(legacyIdMap.legacyEntityType,["project_template","template"]),
     inArray(legacyIdMap.newEntityType,["project_template","template"]),
     eq(legacyIdMap.legacyId,value))).limit(2);
 return rows.length===1?rows[0]?.id??null:null;
}

export async function getProjectTemplateDetail(
  context: RequestContext,
  templateIdInput: string,
) {
  requirePermission(
    context,
    "project-template.read",
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
        .select({ assignment: projectTemplateCollegeAssignments })
        .from(projectTemplateCollegeAssignments)
        .innerJoin(colleges, eq(colleges.id, projectTemplateCollegeAssignments.collegeId))
        .where(and(
          eq(projectTemplateCollegeAssignments.templateId, templateId),
          isNull(projectTemplateCollegeAssignments.revokedAt),
          context.adminScope?.collegeId ? eq(colleges.id, context.adminScope.collegeId) : undefined,
          context.adminScope?.organizationId ? eq(colleges.organizationId, context.adminScope.organizationId) : undefined,
        ))
        .orderBy(asc(projectTemplateCollegeAssignments.assignedAt)),
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
    assignments: assignments.map(row => row.assignment),
  };
}

export async function getAssignedProjectTemplateDetail(
  context: RequestContext,
  collegeIdInput: string,
  templateIdInput: string,
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
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

  // Numeric bookmarks resolve only through this college's active published
  // assignment. The global mapping by itself never grants tenant access.
  const uuid=projectTemplateIdSchema.safeParse(templateIdInput);
  let templateId:string;
  if(uuid.success)templateId=uuid.data;
  else {
    if(!/^[1-9][0-9]{0,9}$/.test(templateIdInput))
      throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_ASSIGNED");
    const matches=await getDb().select({id:projectTemplates.id})
      .from(legacyIdMap)
      .innerJoin(projectTemplates,eq(projectTemplates.id,legacyIdMap.newId))
      .innerJoin(projectTemplateCollegeAssignments,
        eq(projectTemplateCollegeAssignments.templateId,projectTemplates.id))
      .where(and(
        eq(legacyIdMap.legacyId,templateIdInput),
        inArray(legacyIdMap.legacyEntityType,["project_template","template"]),
        inArray(legacyIdMap.newEntityType,["project_template","template"]),
        sql`(${legacyIdMap.collegeId} is null or ${legacyIdMap.collegeId} = ${collegeId})`,
        eq(projectTemplateCollegeAssignments.collegeId,collegeId),
        isNull(projectTemplateCollegeAssignments.revokedAt),
        eq(projectTemplates.status,"PUBLISHED"),
      )).limit(2);
    if(matches.length!==1)
      throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_ASSIGNED");
    templateId=matches[0]!.id;
  }

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
      and(
        eq(
          projectTemplateVersions.id,
          projectTemplateCollegeAssignments.templateVersionId,
        ),
        // Source safeguard until DB-068's composite owner FK is registered.
        // A valid version UUID must also belong to the assigned template.
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
  // Global template authoring is intentionally independent of an individual
  // college feature flag; assigning and materializing enforce module access.
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      // Authentication is a request snapshot; verify the persisted platform
      // role under transactional locks before any global template is created.
      await assertPersistedPlatformPermission(tx,context,"project-template.manage");
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

      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_CREATED,
        subjectType:"project_template",subjectId:template.id,subjectLabel:template.title,
        summary:"Project template created",metadata:{version:1,source:"manual"},
        groupKey:"template:"+template.id,
      });
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
      const [locked] = await tx.select({
        currentVersion: projectTemplates.currentVersion,
        status: projectTemplates.status,
      }).from(projectTemplates).where(eq(projectTemplates.id, templateId))
        .for("update").limit(1);
      if (!locked) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
      // A revoked/disabled platform administrator must not update history
      // from a stale browser tab after the parent template has been locked.
      await assertPersistedPlatformPermission(tx,context,"project-template.manage");
      if (locked.status === "ARCHIVED" ||
          locked.currentVersion !== input.expectedVersion) {
        throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
      }
      const [template] = await tx
        .update(projectTemplates)
        .set({
          title: input.title,
          summary: input.summary ?? null,
          currentVersion: locked.currentVersion + 1,
          updatedAt: new Date(),
        })
        .where(
          and(eq(projectTemplates.id, templateId),
              eq(projectTemplates.currentVersion, input.expectedVersion)),
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

      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_REVISED,
        subjectType:"project_template",subjectId:template.id,subjectLabel:template.title,
        summary:"Project template revised",
        metadata:{previousVersion:input.expectedVersion,newVersion:template.currentVersion,
         changeNote:input.changeNote??null},groupKey:"template:"+template.id,
      });
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
      throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    }
    await assertPersistedPlatformPermission(tx,context,"project-template.manage");
    if (template.status==="ARCHIVED")
      throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_PUBLISHED");
    if (template.status==="PUBLISHED" &&
        template.publishedVersion===template.currentVersion)
      return template;

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

    const activeAssignments=await tx.select({id:projectTemplateCollegeAssignments.id})
      .from(projectTemplateCollegeAssignments)
      .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
        isNull(projectTemplateCollegeAssignments.revokedAt)));
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

    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_PUBLISHED,
      subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
      summary:"Project template published",metadata:{previousStatus:template.status,publishedVersion:published.publishedVersion,
        previousPublishedVersion:template.publishedVersion,
        affectedFutureCollegeAssignments:activeAssignments.length,
        existingWorkspaceInstancesChanged:0,
      },groupKey:"template:"+templateId,
    });
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

    if (!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    await assertPersistedPlatformPermission(tx,context,"project-template.manage");
    if(template.status==="ARCHIVED")
      throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_PUBLISHED");
    if(template.status==="DRAFT")return template;

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

    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_UNPUBLISHED,
      subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
      summary:"Project template unpublished",metadata:{previousStatus:template.status,
        previousPublishedVersion:template.publishedVersion,
        existingWorkspaceInstancesChanged:0,
        futureWorkspaceCreationUsesUnpublishedTemplate:false,
      },groupKey:"template:"+templateId,
    });
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
      // The source snapshot was loaded before the transaction. Never trust
      // that the caller's global management role is still active at insert.
      await assertPersistedPlatformPermission(tx,context,"project-template.manage");
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

      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_DUPLICATED,
        subjectType:"project_template",subjectId:template.id,subjectLabel:template.title,
        summary:"Project template duplicated",
        metadata:{sourceTemplateId:templateId,sourceVersion:source.currentVersion,
          createdVersion:template.currentVersion},groupKey:"template:"+template.id,
      });
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
  requirePermission(context,"project-template.manage");
  const templateId=projectTemplateIdSchema.parse(templateIdInput);
  return getDb().transaction(async tx=>{
    const [template]=await tx.select().from(projectTemplates)
      .where(eq(projectTemplates.id,templateId)).for("update").limit(1);
    if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    await assertPersistedPlatformPermission(tx,context,"project-template.manage");
    if(template.status==="ARCHIVED")return template;
    // Lock before dependency check: a competing college assignment must not
    // silently slip into the archive transaction.
    const [activeAssignment]=await tx.select({id:projectTemplateCollegeAssignments.id})
      .from(projectTemplateCollegeAssignments)
      .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
        isNull(projectTemplateCollegeAssignments.revokedAt))).limit(1);
    if(activeAssignment)throw new ProjectsServiceError("PROJECT_TEMPLATE_HAS_ACTIVE_ASSIGNMENTS");
    const now=new Date();
    const [archived]=await tx.update(projectTemplates)
      .set({status:"ARCHIVED",archivedAt:now,updatedAt:now})
      .where(and(eq(projectTemplates.id,templateId),
        eq(projectTemplates.status,template.status))).returning();
    if(!archived)throw new ProjectsServiceError("PROJECT_TEMPLATE_STALE_VERSION");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_ARCHIVED,
      subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
      summary:"Project template archived",
      metadata:{previousStatus:template.status,previousPublishedVersion:template.publishedVersion,
        activeCollegeAssignments:0},groupKey:"template:"+templateId,
    });
    return archived;
  });
}


/** Legacy bulk assignment API: compare the entire selected college set while
 * the template row is locked, then apply additions/removals as one transaction.
 * A selected organization scopes both the expected and effective sets.
 */
export async function replaceProjectTemplateCollegeAssignments(
  context:RequestContext,templateIdInput:string,
  desiredCollegeIds:readonly string[],expectedCollegeIds:readonly string[],
){
  const templateId=projectTemplateIdSchema.parse(templateIdInput);
  requirePermission(context,"project-template.assign");
  // College-only acting scopes must not silently replace unseen assignments.
  if(context.adminScope?.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const targetIds=[...new Set([...desiredCollegeIds,...expectedCollegeIds])];
  const validated=targetIds.map(id=>collegeIdSchema.parse(id));
  return getDb().transaction(async tx=>{
    const [template]=await tx.select().from(projectTemplates)
      .where(eq(projectTemplates.id,templateId)).for("update").limit(1);
    if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    await assertPersistedPlatformPermission(tx,context,"project-template.assign");
    // All requested colleges must exist, be active and belong to the chosen
    // organization before any write; never leak another tenant's details.
    if(validated.length){
      const allowed=await tx.select({id:colleges.id}).from(colleges)
        .where(and(inArray(colleges.id,validated),
          eq(colleges.status,"ACTIVE"),
          context.adminScope?.organizationId?
            eq(colleges.organizationId,context.adminScope.organizationId):undefined));
      if(allowed.length!==validated.length)
        throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
      for(const id of validated){
        const college=await loadProjectCollegeScope(id);
        requirePermission(context,"project-template.assign",{
          organizationId:college.organizationId,collegeId:id,
        });
      }
    }
    const existing=await tx.select({id:projectTemplateCollegeAssignments.id,
      collegeId:projectTemplateCollegeAssignments.collegeId})
      .from(projectTemplateCollegeAssignments)
      .innerJoin(colleges,eq(colleges.id,projectTemplateCollegeAssignments.collegeId))
      .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
        isNull(projectTemplateCollegeAssignments.revokedAt),
        context.adminScope?.organizationId?
          eq(colleges.organizationId,context.adminScope.organizationId):undefined))
      .for("update");
    const current=existing.map(item=>item.collegeId).sort();
    const expected=[...expectedCollegeIds].sort();
    if(current.length!==expected.length||
       current.some((id,index)=>id!==expected[index]))
      throw new ProjectsServiceError("PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT");
    const desired=new Set(desiredCollegeIds);
    const old=new Set(current);
    const removals=existing.filter(item=>!desired.has(item.collegeId));
    const additions=desiredCollegeIds.filter(id=>!old.has(id));
    if(additions.length && (template.status!=="PUBLISHED"||template.publishedVersion===null))
      throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_PUBLISHED");
    let versionId:string|null=null;
    if(additions.length){
      const [version]=await tx.select({id:projectTemplateVersions.id})
       .from(projectTemplateVersions)
       .where(and(eq(projectTemplateVersions.templateId,templateId),
         eq(projectTemplateVersions.version,template.publishedVersion!))).limit(1);
      if(!version)throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
      versionId=version.id;
    }
    const now=new Date();
    for(const row of removals){
      await tx.update(projectTemplateCollegeAssignments).set({revokedAt:now})
        .where(eq(projectTemplateCollegeAssignments.id,row.id));
    }
    for(const collegeId of additions){
      await tx.insert(projectTemplateCollegeAssignments).values({
        templateId,templateVersionId:versionId!,collegeId,
        assignedByUserId:context.user.id,
      });
    }
    for(const collegeId of [...additions,...removals.map(row=>row.collegeId)]){
      const assigned=desired.has(collegeId);
      await recordActivityEventInTransaction(tx,context,{
        eventType:assigned?ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_ASSIGNED:
          ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_REVOKED,
        collegeId,subjectType:"project_template",subjectId:templateId,
        subjectLabel:template.title,
        summary:assigned?"Project template assigned to college":"Project template removed from college",
        metadata:{bulk:true,expectedCollegeIds:expected,desiredCollegeIds:[...desired]},
        groupKey:"template:"+templateId,
      });
    }
    return {collegeIds:[...desired].sort(),added:additions,
      removed:removals.map(row=>row.collegeId),unchanged:current.filter(id=>desired.has(id))};
  });
}

export async function assignProjectTemplateToCollege(
  context:RequestContext,templateIdInput:string,collegeIdInput:string,
){
  const templateId=projectTemplateIdSchema.parse(templateIdInput);
  const collegeId=collegeIdSchema.parse(collegeIdInput);
  const college=await loadProjectCollegeScope(collegeId);
  requirePermission(context,"project-template.assign",{
    organizationId:college.organizationId,collegeId:college.id,
  });
  try{
    return await getDb().transaction(async tx=>{
      // Serialize assignment with template publication and archival.
      const [template]=await tx.select().from(projectTemplates)
        .where(eq(projectTemplates.id,templateId)).for("update").limit(1);
      if(!template||template.status!=="PUBLISHED"||template.publishedVersion===null)
        throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_PUBLISHED");
      // RequestContext was captured before the transaction. Re-check the
      // persisted actor and system roles while holding SHARE locks so a
      // revoked Super Admin cannot reassign college templates from a stale tab.
      await assertPersistedPlatformPermission(tx,context,"project-template.assign",{
        organizationId:college.organizationId,collegeId:college.id,
      });
      const [version]=await tx.select({id:projectTemplateVersions.id})
        .from(projectTemplateVersions)
        .where(and(eq(projectTemplateVersions.templateId,templateId),
          eq(projectTemplateVersions.version,template.publishedVersion))).limit(1);
      if(!version)throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
      const [existing]=await tx.select().from(projectTemplateCollegeAssignments)
        .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
          eq(projectTemplateCollegeAssignments.collegeId,collegeId),
          isNull(projectTemplateCollegeAssignments.revokedAt))).for("update").limit(1);
      // A browser retry or a second tab assigning the same published version
      // is a no-op. Do not change who assigned it, reset the assignment date,
      // or write a second activity/notification event. The template row lock
      // serializes this decision with parallel assignments and publication.
      if(existing?.templateVersionId===version.id)return existing;
      const now=new Date();
      const [saved]=existing?
        await tx.update(projectTemplateCollegeAssignments).set({
          templateVersionId:version.id,assignedByUserId:context.user.id,assignedAt:now,
        }).where(eq(projectTemplateCollegeAssignments.id,existing.id)).returning():
        await tx.insert(projectTemplateCollegeAssignments).values({
          templateId,templateVersionId:version.id,collegeId,assignedByUserId:context.user.id,
        }).returning();
      if(!saved)throw new ProjectsServiceError("PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_ASSIGNED,
        organizationId:college.organizationId,collegeId:college.id,
        subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
        summary:existing?"Project template assignment refreshed":"Project template assigned to college",
        metadata:{assignmentId:saved.id,publishedVersion:template.publishedVersion,
          previousVersionId:existing?.templateVersionId??null,newVersionId:version.id},
        groupKey:"template:"+templateId,
      });
      return saved;
    });
  }catch(error){
    if(error instanceof ProjectsServiceError)throw error;
    throw mapTemplateConstraint(error);
  }
}

export async function revokeProjectTemplateFromCollege(
  context:RequestContext,templateIdInput:string,collegeIdInput:string,
){
  const templateId=projectTemplateIdSchema.parse(templateIdInput);
  const collegeId=collegeIdSchema.parse(collegeIdInput);
  const college=await loadProjectCollegeScope(collegeId);
  requirePermission(context,"project-template.assign",{
    organizationId:college.organizationId,collegeId:college.id,
  });
  return getDb().transaction(async tx=>{
    const [template]=await tx.select({id:projectTemplates.id,title:projectTemplates.title})
      .from(projectTemplates).where(eq(projectTemplates.id,templateId))
      .for("update").limit(1);
    if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
    await assertPersistedPlatformPermission(tx,context,"project-template.assign",{
      organizationId:college.organizationId,collegeId:college.id,
    });
    const [revoked]=await tx.update(projectTemplateCollegeAssignments)
      .set({revokedAt:new Date()})
      .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
        eq(projectTemplateCollegeAssignments.collegeId,collegeId),
        isNull(projectTemplateCollegeAssignments.revokedAt))).returning();
    if(!revoked){
      // A successful revoke response may be lost. The template lock makes a
      // second identical request a read-only retry, not a duplicate activity.
      // Never treat a never-assigned college as successful.
      const [previous]=await tx.select().from(projectTemplateCollegeAssignments)
        .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
          eq(projectTemplateCollegeAssignments.collegeId,collegeId),
          isNotNull(projectTemplateCollegeAssignments.revokedAt)))
        .orderBy(desc(projectTemplateCollegeAssignments.revokedAt),
          desc(projectTemplateCollegeAssignments.id)).limit(1);
      if(previous)return previous;
      throw new ProjectsServiceError("PROJECT_TEMPLATE_ASSIGNMENT_NOT_FOUND");
    }
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_REVOKED,
      organizationId:college.organizationId,collegeId:college.id,
      subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
      summary:"Project template removed from college",
      metadata:{assignmentId:revoked.id,templateVersionId:revoked.templateVersionId},
      groupKey:"template:"+templateId,
    });
    return revoked;
  });
}


export async function listAssignedProjectTemplates(
  context: RequestContext,
  collegeIdInput: string,
  searchInput = "",
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadProjectCollegeScope(collegeId);

  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  const q=searchInput.trim().slice(0,120).replace(/[%_]/g,"");
  const needle="%"+q+"%";

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
        q ? or(ilike(projectTemplateVersions.title,needle),
          ilike(projectTemplates.slug,needle)) : undefined,
      ),
    )
    .orderBy(asc(projectTemplateVersions.title));
}


/** Exact old POST /api/v1/admin/project-templates compatibility envelope:
 * The vNext API remains POST /api/projects/templates with a typed blueprint.
 * Public callers may consume status/message/data without treating the source
 * numeric template ID as a live UUID permission grant. */
export const LEGACY_PROJECT_TEMPLATE_ROUTE_CONTRACT={
 sourceCreate:"POST /api/v1/admin/project-templates",
 currentCreate:"POST /api/projects/templates",
 sourceCatalog:"GET /api/v1/admin/project-templates",
 currentCatalog:"GET /api/projects/templates",
 createdStatus:201,
 successMessage:"Project template created",
} as const;

export function projectTemplatePublicationImpact(input:{
 status:string;currentVersion:number;publishedVersion:number|null;
 activeAssignedColleges:number;
}){
 return {
  visibleInPublishedCatalog:input.status==="PUBLISHED"&&input.publishedVersion!==null,
  displayedVersion:input.publishedVersion??input.currentVersion,
  futureWorkspacesUsePublishedVersion:input.status==="PUBLISHED"&&input.publishedVersion!==null,
  activeAssignedColleges:input.activeAssignedColleges,
  existingWorkspaceInstancesChanged:0 as const,
  note:"Publishing updates future workspaces in assigned colleges. Existing workspaces retain their pinned template version.",
 };
}
