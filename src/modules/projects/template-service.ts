import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  isNotNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {
  projectTemplateCollegeAssignments,
  projectTemplates,
  projectTemplateVersions,
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

export async function listProjectTemplates(
  context: RequestContext,
) {
  requirePermission(
    context,
    "project-template.read",
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
      summary:"Project template published",metadata:{previousStatus:template.status,publishedVersion:published.publishedVersion,previousPublishedVersion:template.publishedVersion},groupKey:"template:"+templateId,
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
      summary:"Project template unpublished",metadata:{previousStatus:template.status,previousPublishedVersion:template.publishedVersion},groupKey:"template:"+templateId,
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


/** Atomic equivalent of the legacy PUT colleges API. All IDs are vNext
 * UUIDs, not old numeric college/template IDs. A single template row lock
 * serializes the entire compare-and-replace with publication and individual
 * assignment/revocation. No partial set is visible if any check fails.
 */
export async function replaceProjectTemplateCollegeAssignments(
 context:RequestContext,templateIdInput:string,
 rawInput:{collegeIds:string[];expectedCollegeIds:string[]},
){
 requirePermission(context,"project-template.manage");
 const templateId=projectTemplateIdSchema.parse(templateIdInput);
 const desired=Array.from(new Set(rawInput.collegeIds)).sort();
 const expected=Array.from(new Set(rawInput.expectedCollegeIds)).sort();
 if(desired.length!==rawInput.collegeIds.length||
    expected.length!==rawInput.expectedCollegeIds.length){
   throw new ProjectsServiceError("PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT");
 }
 const scopedIds=Array.from(new Set([...desired,...expected]));
 // Check each college's active organization and the actor's explicit scope
 // without querying assignments. This prevents foreign IDs in desired sets.
 const collegesById=new Map<string,Awaited<ReturnType<typeof loadProjectCollegeScope>>>();
 for(const collegeId of scopedIds){
   const college=await loadProjectCollegeScope(collegeId);
   requirePermission(context,"project-template.assign",{
     collegeId:college.id,organizationId:college.organizationId,
   });
   collegesById.set(collegeId,college);
 }
 try{
  return await getDb().transaction(async tx=>{
   const [template]=await tx.select().from(projectTemplates)
     .where(eq(projectTemplates.id,templateId)).for("update").limit(1);
   if(!template)throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_FOUND");
   await assertPersistedPlatformPermission(tx,context,"project-template.manage");
   for(const college of collegesById.values()){
     await assertPersistedPlatformPermission(tx,context,"project-template.assign",{
       collegeId:college.id,organizationId:college.organizationId,
     });
   }
   const existing=await tx.select().from(projectTemplateCollegeAssignments)
     .where(and(eq(projectTemplateCollegeAssignments.templateId,templateId),
       isNull(projectTemplateCollegeAssignments.revokedAt)))
     .orderBy(asc(projectTemplateCollegeAssignments.collegeId));
   const current=existing.map(item=>item.collegeId).sort();
   if(current.length!==expected.length||
      current.some((id,index)=>id!==expected[index])){
     throw new ProjectsServiceError("PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT");
   }
   const oldSet=new Set(current),newSet=new Set(desired);
   const additions=desired.filter(id=>!oldSet.has(id));
   const removals=current.filter(id=>!newSet.has(id));
   if(!additions.length&&!removals.length){
     return {collegeIds:current,addedCount:0,removedCount:0,changed:false};
   }
   if(additions.length&&(template.status!=="PUBLISHED"||!template.publishedVersion)){
     throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_PUBLISHED");
   }
   const [version]=additions.length?await tx.select({id:projectTemplateVersions.id})
     .from(projectTemplateVersions).where(and(
       eq(projectTemplateVersions.templateId,templateId),
       eq(projectTemplateVersions.version,template.publishedVersion!))).limit(1):[];
   if(additions.length&&!version)throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
   const now=new Date();
   for(const row of existing.filter(row=>!newSet.has(row.collegeId))){
     await tx.update(projectTemplateCollegeAssignments).set({revokedAt:now})
       .where(eq(projectTemplateCollegeAssignments.id,row.id));
     const college=collegesById.get(row.collegeId)!;
     await recordActivityEventInTransaction(tx,context,{
       eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_REVOKED,
       organizationId:college.organizationId,collegeId:college.id,
       subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
       summary:"Project template removed from college",
       metadata:{assignmentId:row.id,templateVersionId:row.templateVersionId,via:"bulk_set"},
       groupKey:"template:"+templateId,
     });
   }
   for(const collegeId of additions){
     const [inserted]=await tx.insert(projectTemplateCollegeAssignments).values({
       templateId,templateVersionId:version!.id,collegeId,
       assignedByUserId:context.user.id,assignedAt:now,
     }).returning();
     if(!inserted)throw new ProjectsServiceError("PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT");
     const college=collegesById.get(collegeId)!;
     await recordActivityEventInTransaction(tx,context,{
       eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TEMPLATE_COLLEGE_ASSIGNED,
       organizationId:college.organizationId,collegeId,
       subjectType:"project_template",subjectId:templateId,subjectLabel:template.title,
       summary:"Project template assigned to college",
       metadata:{assignmentId:inserted.id,publishedVersion:template.publishedVersion,
        newVersionId:version!.id,via:"bulk_set"},
       groupKey:"template:"+templateId,
     });
   }
   return {collegeIds:desired,addedCount:additions.length,
     removedCount:removals.length,changed:true};
  });
 }catch(error){
   if(error instanceof ProjectsServiceError)throw error;
   throw mapTemplateConstraint(error);
 }
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
