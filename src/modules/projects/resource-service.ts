import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {notifyActiveProjectMembers} from "./project-notification-service";
import {projectResourceAuditInput} from "./mentor-resource-audit-model";
import {randomUUID} from "node:crypto";
import {
  projectInstances,
  projectResources,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectLifecycleAccess,
  requireProjectReadAccess,
} from "./access";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  createProjectResourceInputSchema,
  projectResourceIdSchema,
  updateProjectResourceInputSchema,
  type CreateProjectResourceInput,
  type UpdateProjectResourceInput,
} from "./validation";

function mapResourceConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "project_resources_project_sequence_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_RESOURCE_SEQUENCE_CONFLICT",
    );
  }

  return error;
}

function ensureMutableProject(
  status: string,
) {
  if (status === "ARCHIVED" || status === "COMPLETED") {
    throw new ProjectsServiceError(
      "PROJECT_RESOURCE_INVALID_STATE",
    );
  }
}

export async function listProjectResources(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  return getDb()
    .select()
    .from(projectResources)
    .where(
      and(
        eq(
          projectResources.projectId,
          scope.project.id,
        ),
        eq(projectResources.status, "ACTIVE"),
        scope.access === "ADMIN" || scope.access === "MENTOR" ? undefined : eq(projectResources.visibility, "TEAM"),
      ),
    )
    .orderBy(asc(projectResources.sequence));
}

export async function createProjectResource(
  context: RequestContext,
  projectIdInput: string,
  rawInput: CreateProjectResourceInput,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const input =
    createProjectResourceInputSchema.parse(
      rawInput,
    );
  if (!["ADMIN","MENTOR","LEARNER"].includes(scope.access))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(scope.access === "LEARNER" && (input.required || input.visibility === "MENTOR_ONLY"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(eq(projectInstances.id, scope.project.id))
        .for("update")
        .limit(1);

      if (!project) {
        throw new ProjectsServiceError("PROJECT_NOT_FOUND");
      }
      ensureMutableProject(project.status);
      if(scope.access==="LEARNER" && project.status!=="ACTIVE")
        throw new ProjectsServiceError("PROJECT_RESOURCE_INVALID_STATE");

      const [latest] = await tx
        .select({ sequence: projectResources.sequence })
        .from(projectResources)
        .where(eq(projectResources.projectId, scope.project.id))
        .orderBy(desc(projectResources.sequence))
        .limit(1);

      const [resource] = await tx
        .insert(projectResources)
        .values({
          projectId: scope.project.id,
          templateKey: null,
          title: input.title,
          description: input.description ?? null,
          url: input.url ?? null,
          required: input.required ?? false,
          visibility: input.visibility ?? "TEAM",
          sequence: (latest?.sequence ?? -1) + 1,
        })
        .returning();

      if(!resource)throw new ProjectsServiceError("PROJECT_RESOURCE_NOT_FOUND");
      const event=await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("CREATED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },resource));
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        roles:["MENTOR"],exceptUserId:context.user.id,
        title:"New project resource",body:"A resource was added to your project.",
        actionHref:"/mentor/projects/"+scope.project.id+"?tab=resources",
      });
      if(resource.visibility==="TEAM") {
      await notifyActiveProjectMembers(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        roles:["LEARNER"],exceptUserId:context.user.id,
        title:"New project resource",body:"A resource was added to your project.",
        actionHref:"/learn/projects/"+scope.project.id+"?tab=resources",
      });
      }
      return resource;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) throw error;
    throw mapResourceConstraint(error);
  }
}

export async function updateProjectResource(
  context: RequestContext,
  projectIdInput: string,
  resourceIdInput: string,
  rawInput: UpdateProjectResourceInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const input =
    updateProjectResourceInputSchema.parse(
      rawInput,
    );
  const resourceId =
    projectResourceIdSchema.parse(resourceIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("update")
      .limit(1);

    if (!project) {
      throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    }
    ensureMutableProject(project.status);

    const [resource] = await tx
      .select()
      .from(projectResources)
      .where(
        and(
          eq(projectResources.id, resourceId),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, "ACTIVE"),
        ),
      )
      .for("update")
      .limit(1);

    if (!resource) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    const merged =
      createProjectResourceInputSchema.parse({
        title: input.title ?? resource.title,
        description:
          input.description !== undefined
            ? input.description
            : resource.description,
        url:
          input.url !== undefined
            ? input.url
            : resource.url,
        required:
          input.required ?? resource.required,
        visibility: input.visibility ?? resource.visibility,
      });

    const [updated] = await tx
      .update(projectResources)
      .set({
        title: merged.title,
        description: merged.description ?? null,
        url: merged.url ?? null,
        required: merged.required ?? false,
        visibility: merged.visibility ?? "TEAM",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectResources.id, resource.id),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!updated) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    const event=await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("UPDATED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },updated,randomUUID()));
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["MENTOR"],exceptUserId:context.user.id,
      title:"Project resource updated",body:"A project resource has changed.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=resources",
    });
    if(updated.visibility==="TEAM") {
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["LEARNER"],exceptUserId:context.user.id,
      title:"Project resource updated",body:"A project resource has changed.",
      actionHref:"/learn/projects/"+scope.project.id+"?tab=resources",
    });
    }
    return updated;
  });
}

export async function archiveProjectResource(
  context: RequestContext,
  projectIdInput: string,
  resourceIdInput: string,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const resourceId =
    projectResourceIdSchema.parse(resourceIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("update")
      .limit(1);

    if (!project) {
      throw new ProjectsServiceError("PROJECT_NOT_FOUND");
    }
    ensureMutableProject(project.status);

    const [resource] = await tx
      .select({ id: projectResources.id })
      .from(projectResources)
      .where(
        and(
          eq(projectResources.id, resourceId),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, "ACTIVE"),
        ),
      )
      .for("update")
      .limit(1);

    if (!resource) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    const [archived] = await tx
      .update(projectResources)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectResources.id, resource.id),
          eq(projectResources.projectId, scope.project.id),
          eq(projectResources.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!archived) {
      throw new ProjectsServiceError(
        "PROJECT_RESOURCE_NOT_FOUND",
      );
    }

    await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("ARCHIVED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },archived));
    return archived;
  });
}
