import {
  and,
  asc,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {templateResourceMaterializationFields} from "./template-resource-materialization";
import {legacyWorkspaceProjection} from "./legacy-workspace-projection";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { notifyProjectMemberships, notifyActiveProjectMembers } from "./project-notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  cohorts,
  departments,
  learnerProgramEnrollments,
  programs,
  sectionEnrollments,
  sections,
  membershipRoles,
  projectInstances,
  projectMembers,
  projectReleases,
  projectResources,
  projectSprints,
  projectTasks,
  projectTemplateCollegeAssignments,
  projectTemplates,
  projectTemplateVersions,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { collegeIdSchema } from "@/modules/academics/validation";
import { requireProjectManageAccess, requireProjectReadAccess } from "./access";
import { loadProjectCollegeScope } from "./scope";
import {archiveProjectInstanceInputSchema,projectArchiveTokenMatches} from "./instance-archive-model";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  createProjectInstanceInputSchema,
  projectInstanceIdSchema,
  publishableProjectTemplateBlueprintSchema,
} from "./validation";

function mapInstanceConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "project_instances_college_slug_uq":
      return new ProjectsServiceError(
        "PROJECT_SLUG_CONFLICT",
      );
    default:
      return error;
  }
}

async function loadAssignedTemplateVersion(
  collegeId: string,
  templateId: string,
) {
  const [assigned] = await getDb()
    .select({
      templateId: projectTemplates.id,
      templateVersionId:
        projectTemplateVersions.id,
      version: projectTemplateVersions.version,
      templateTitle: projectTemplateVersions.title,
      templateSummary: projectTemplateVersions.summary,
      blueprint: projectTemplateVersions.blueprint,
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

  if (!assigned) {
    throw new ProjectsServiceError(
      "PROJECT_TEMPLATE_NOT_ASSIGNED",
    );
  }

  return {
    ...assigned,
    blueprint:
      publishableProjectTemplateBlueprintSchema.parse(
        assigned.blueprint,
      ),
  };
}

async function loadProject(
  projectId: string,
) {
  const [project] = await getDb()
    .select()
    .from(projectInstances)
    .where(eq(projectInstances.id, projectId))
    .limit(1);

  if (!project) {
    throw new ProjectsServiceError(
      "PROJECT_NOT_FOUND",
    );
  }

  return project;
}

export async function createProjectInstance(
  context: RequestContext,
  rawInput: unknown,
) {
  const input =
    createProjectInstanceInputSchema.parse(rawInput);
  const college =
    await loadProjectCollegeScope(input.collegeId);

  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const assigned =
    await loadAssignedTemplateVersion(
      college.id,
      input.templateId,
    );
  const blueprint = assigned.blueprint;
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      // The request context is a snapshot; role or user suspension could
      // happen while the published template and members are loaded. Lock the
      // actual actor before any project instance or activity is persisted.
      await assertPersistedPlatformPermission(tx,context,"projects.manage",{
        collegeId:college.id,organizationId:college.organizationId,
      });
      if (input.primaryMentorMembershipId) {
        const [mentor] = await tx
          .select({
            membershipId: collegeMemberships.id,
          })
          .from(collegeMemberships)
          .innerJoin(
            users,
            eq(
              users.id,
              collegeMemberships.userId,
            ),
          )
          .innerJoin(
            membershipRoles,
            and(
              eq(
                membershipRoles.membershipId,
                collegeMemberships.id,
              ),
              eq(
                membershipRoles.role,
                "MENTOR",
              ),
            ),
          )
          .where(
            and(
              eq(
                collegeMemberships.id,
                input.primaryMentorMembershipId,
              ),
              eq(
                collegeMemberships.collegeId,
                college.id,
              ),
              eq(
                collegeMemberships.status,
                "ACTIVE",
              ),
              eq(
                users.platformStatus,
                "ACTIVE",
              ),
            ),
          )
          .for("share")
          .limit(1);

        if (!mentor) {
          throw new ProjectsServiceError(
            "PROJECT_MEMBER_ROLE_REQUIRED",
          );
        }
      }

      if(input.sectionId){
        const [section]=await tx.select({id:sections.id}).from(sections)
          .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
          .innerJoin(programs,eq(programs.id,cohorts.programId))
          .innerJoin(departments,eq(departments.id,programs.departmentId))
          .where(and(eq(sections.id,input.sectionId),eq(departments.collegeId,college.id),
            eq(sections.status,"ACTIVE"))).limit(1);
        if(!section)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
      }
      if(input.learnerMembershipIds.length){
        const members=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
          .innerJoin(users,eq(users.id,collegeMemberships.userId))
          .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
            eq(membershipRoles.role,"LEARNER")))
          .innerJoin(learnerProgramEnrollments,eq(learnerProgramEnrollments.membershipId,collegeMemberships.id))
          .leftJoin(sectionEnrollments,and(eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
            input.sectionId ? eq(sectionEnrollments.sectionId,input.sectionId) : undefined,
            eq(sectionEnrollments.status,"ACTIVE")))
          .where(and(inArray(collegeMemberships.id,input.learnerMembershipIds),
            eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE"),
            eq(learnerProgramEnrollments.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
            input.sectionId ? isNotNull(sectionEnrollments.id) : undefined));
        if(new Set(members.map(row=>row.id)).size!==input.learnerMembershipIds.length)
          throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
      }

      const [project] = await tx
        .insert(projectInstances)
        .values({
          collegeId: college.id,
          templateId: assigned.templateId,
          templateVersionId:
            assigned.templateVersionId,
          slug: input.slug,
          title: input.title,
          sectionId: input.sectionId??null,
          status: input.initialStatus,
          phase: input.phase || "Planning",
          progressPercent: input.progressPercent,
          dueLabel: input.dueLabel || null,
          blocker: input.blocker || null,
          nextAction: input.nextAction || null,
          summary:
            input.summary ??
            assigned.templateSummary ??
            null,
          createdByUserId: context.user.id,
        })
        .returning();

      if (!project) {
        throw new Error(
          "Project instance insert returned no row",
        );
      }

      if (input.primaryMentorMembershipId) {
        await tx
          .insert(projectMembers)
          .values({
            projectId: project.id,
            membershipId:
              input.primaryMentorMembershipId,
            role: "MENTOR",
            roleKind: "MENTOR",
            canMutate: true,
            isPrimary: true,
            roleLabel: "Project Mentor",
            createdByUserId:
              context.user.id,
          });
      }

      if(input.learnerMembershipIds.length){
        await tx.insert(projectMembers).values(input.learnerMembershipIds.map(membershipId=>({
          projectId:project.id,membershipId,role:"LEARNER" as const,
          roleKind:"LEARNER" as const,canMutate:true,isPrimary:false,
          roleLabel:"Project Learner",createdByUserId:context.user.id,
        })));
      }

      const releaseValues = [
        ...blueprint.releases,
      ]
        .sort((a, b) => a.sequence - b.sequence)
        .map((release) => ({
          projectId: project.id,
          templateKey: release.key,
          title: release.title,
          description: release.description ?? null,
          sequence: release.sequence,
        }));
      const releaseRows = await tx
        .insert(projectReleases)
        .values(releaseValues)
        .returning({
          id: projectReleases.id,
          templateKey: projectReleases.templateKey,
        });
      const releaseIds = new Map(
        releaseRows.map((row) => [
          row.templateKey,
          row.id,
        ]),
      );

      const sprintValues = [
        ...blueprint.sprints,
      ]
        .sort((a, b) => a.sequence - b.sequence)
        .map((sprint) => {
          const releaseId = releaseIds.get(
            sprint.releaseKey,
          );
          if (!releaseId) {
            throw new Error(
              "Validated Project sprint lost its release during materialization",
            );
          }

          return {
            projectId: project.id,
            releaseId,
            templateKey: sprint.key,
            title: sprint.title,
            description:
              sprint.description ?? null,
            sequence: sprint.sequence,
          };
        });
      const sprintRows = await tx
        .insert(projectSprints)
        .values(sprintValues)
        .returning({
          id: projectSprints.id,
          templateKey: projectSprints.templateKey,
        });
      const sprintIds = new Map(
        sprintRows.map((row) => [
          row.templateKey,
          row.id,
        ]),
      );

      const taskValues = [...blueprint.tasks]
        .sort((a, b) => a.sequence - b.sequence)
        .map((task) => {
          const sprintId=task.sprintKey?sprintIds.get(task.sprintKey):null;
          if(task.sprintKey&&!sprintId){
            throw new Error("Validated Project task lost its sprint during materialization");
          }

          return {
            projectId: project.id,
            sprintId,
            templateKey:task.key,
            legacyTaskKey:task.legacyKey??null,
            title: task.title,
            description:task.description??null,
            dueLabel:task.dueLabel??null,
            taskType:task.taskType??null,
            approach:task.approach??null,
            acceptanceCriteria:
              task.acceptanceCriteria ?? null,
            priority: task.priority,
            estimatePoints: task.estimatePoints ?? null,
            sequence: task.sequence,
          };
        });
      await tx
        .insert(projectTasks)
        .values(taskValues);

      if (blueprint.resources.length > 0) {
        await tx.insert(projectResources).values(
          [...blueprint.resources]
            .sort(
              (a, b) =>
                a.sequence - b.sequence,
            )
            .map((resource) => ({
              projectId: project.id,
              templateKey: resource.key,
              title: resource.title,
              description:
                resource.description ?? null,
              url: resource.url ?? null,
              required: resource.required,
              ...templateResourceMaterializationFields(resource),
              sequence: resource.sequence,
            })),
        );
      }

      const createdEvent = await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_CREATED,
          collegeId: college.id,
          organizationId:
            college.organizationId,
          subjectType: "project",
          subjectId: project.id,
          subjectLabel: project.title,
          summary:
            `Project ${project.title} created`,
          metadata: {
            projectId: project.id,
            slug: project.slug,
            templateId: project.templateId,
            templateVersionId:
              project.templateVersionId,
          },
          groupKey:
            `project:${project.id}`,
          dedupeKey:
            `project:${project.id}:created`,
        },
      );

      if(input.primaryMentorMembershipId) {
        await notifyProjectMemberships(tx, createdEvent.id, {
          projectId: project.id, collegeId: college.id,
          membershipIds: [input.primaryMentorMembershipId],
          title: "New project assigned",
          body: "You have been assigned to " + project.title + ".",
          actionHref: "/mentor/projects/" + project.id,
        });
      }
      if(input.learnerMembershipIds.length){
        await notifyProjectMemberships(tx,createdEvent.id,{
          projectId:project.id,collegeId:college.id,
          membershipIds:input.learnerMembershipIds,
          title:"New project assigned",
          body:"You have been added to "+project.title+".",
          actionHref:"/learn/projects/"+project.id,
        });
      }
      return project;
    });
  } catch (error) {
    throw mapInstanceConstraint(error);
  }
}

export async function listProjectInstances(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadProjectCollegeScope(collegeId);

  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  return getDb()
    .select()
    .from(projectInstances)
    .where(
      eq(projectInstances.collegeId, college.id),
      isNull(projectInstances.deletedAt),
    )
    .orderBy(asc(projectInstances.title));
}

export async function archiveProjectInstance(
  context: RequestContext,
  projectIdInput: string,
  rawInput?: unknown,
) {
  // Legacy internal service callers may omit the token. The authenticated
  // HTTP route requires it for every user-initiated archive attempt.
  const input=rawInput===undefined?null:archiveProjectInstanceInputSchema.parse(rawInput);
  const scope =
    await requireProjectManageAccess(
      context,
      projectIdInput,
    );
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select()
      .from(projectInstances)
      .where(
        and(
          eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId, scope.collegeId),
        ),
      )
      .for("update")
      .limit(1);

    if (!project) {
      throw new ProjectsServiceError(
        "PROJECT_NOT_FOUND",
      );
    }
    // The context can be revoked after the initial project read. Persisted
    // user/role SHARE locks must be held before even an idempotent archive
    // response, so suspended actors cannot mutate or reconfirm a project.
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    });

    if (project.status === "ARCHIVED") {
      // Safe idempotent retry: no second audit, notification or mutation.
      return project;
    }
    if(input && !projectArchiveTokenMatches(project.updatedAt,input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");

    const now = new Date();
    const [archived] = await tx
      .update(projectInstances)
      .set({
        status: "ARCHIVED",
        archivedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(projectInstances.id, project.id),
          eq(projectInstances.collegeId, scope.collegeId),
          ne(projectInstances.status, "ARCHIVED"),
        ),
      )
      .returning();

    if (!archived) {
      const [current] = await tx
        .select()
        .from(projectInstances)
        .where(eq(projectInstances.id, project.id))
        .limit(1);
      if (current?.status === "ARCHIVED") {
        return current;
      }
      throw new ProjectsServiceError(
        "PROJECT_INVALID_STATE",
      );
    }

    const archiveEvent = await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_ARCHIVED,
        collegeId: scope.collegeId,
        organizationId:
          scope.organizationId,
        subjectType:
          "project_instance",
        subjectId: archived.id,
        subjectLabel: archived.title,
        summary:
          "Project " +
          archived.title +
          " archived",
        metadata: {
          projectId: archived.id,
          previousStatus: project.status,
          status: archived.status,
        },
        groupKey:
          "projects:instance:" +
          archived.id,
        dedupeKey:
          "projects:instance:" +
          archived.id +
          ":archived:" +
          now.toISOString(),
      },
    );

    await notifyActiveProjectMembers(tx, archiveEvent.id,{
      projectId:archived.id,collegeId:scope.collegeId,exceptUserId:context.user.id,
      roles:["LEARNER"],title:"Project archived",
      body:archived.title+" has been archived.",
      actionHref:"/learn/projects/"+archived.id,
    });
    await notifyActiveProjectMembers(tx, archiveEvent.id,{
      projectId:archived.id,collegeId:scope.collegeId,exceptUserId:context.user.id,
      roles:["MENTOR"],title:"Project archived",
      body:archived.title+" has been archived.",
      actionHref:"/mentor/projects/"+archived.id,
    });
    return archived;
  });
}

/** Numeric legacy deep links are scoped to the selected college and
 * re-authorized through the normal vNext project access check.
 */
export async function resolveLegacyProjectInstanceId(
 context:RequestContext,rawLegacyId:string,
):Promise<string|null>{
 if(!/^[1-9][0-9]{0,9}$/.test(rawLegacyId))return null;
 const legacyId=Number(rawLegacyId);
 if(!Number.isSafeInteger(legacyId))return null;
 const collegeId=context.membership?.collegeId??context.adminScope?.collegeId;
 if(!collegeId)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const [row]=await getDb().select({id:projectInstances.id})
  .from(projectInstances).where(and(
   eq(projectInstances.collegeId,collegeId),
   eq(projectInstances.legacyProjectId,legacyId),
   isNull(projectInstances.deletedAt),
  )).limit(1);
 if(!row)return null;
 await requireProjectReadAccess(context,row.id);
 return row.id;
}

export async function getProjectInstanceWorkspace(
  context: RequestContext,
  projectIdInput: string,
) {
  const projectId =
    projectInstanceIdSchema.parse(projectIdInput);
  const scope =
    await requireProjectReadAccess(
      context,
      projectId,
    );
  const project = scope.project;

  const db = getDb();
  // A failed releases query must not erase the usable tasks, resources,
  // meetings and Team tabs. Keep the error distinct from an empty plan.
  const [releaseResult, sprints, tasks, resources] =
    await Promise.all([
      db
        .select()
        .from(projectReleases)
        .where(
          eq(projectReleases.projectId, projectId),
        )
        .orderBy(asc(projectReleases.sequence))
        .then(rows => ({ rows, failed: false }))
        .catch(() => ({ rows: [] as (typeof projectReleases.$inferSelect)[], failed: true })),
      db
        .select()
        .from(projectSprints)
        .where(and(eq(projectSprints.projectId, projectId),
          isNull(projectSprints.deletedAt)))
        .orderBy(asc(projectSprints.sequence)),
      db
        .select()
        .from(projectTasks)
        .where(and(eq(projectTasks.projectId, projectId),isNull(projectTasks.deletedAt)))
        .orderBy(asc(projectTasks.sequence)),
      db
        .select()
        .from(projectResources)
        .where(
          and(
            eq(
              projectResources.projectId,
              projectId,
            ),
            scope.access === "ADMIN" || scope.access === "MENTOR" ? undefined : eq(projectResources.status, "ACTIVE"),
            scope.access === "ADMIN" || scope.access === "MENTOR" ? undefined : eq(projectResources.visibility, "TEAM"),
          ),
        )
        .orderBy(asc(projectResources.sequence)),
    ]);

  return {
    project,
    releases: releaseResult.rows,
    releasesLoadError: releaseResult.failed,
    sprints,
    tasks,
    resources,
    legacySnapshot:legacyWorkspaceProjection({
      project,releases:releaseResult.rows,sprints,tasks,resources,
    }),
  };
}
