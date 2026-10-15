import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
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
  if (status === "ARCHIVED") {
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
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const input =
    createProjectResourceInputSchema.parse(
      rawInput,
    );
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
          sequence: (latest?.sequence ?? -1) + 1,
        })
        .returning();

      if(!resource)throw new ProjectsServiceError("PROJECT_RESOURCE_NOT_FOUND");
      await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("CREATED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },resource));
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
      });

    const [updated] = await tx
      .update(projectResources)
      .set({
        title: merged.title,
        description: merged.description ?? null,
        url: merged.url ?? null,
        required: merged.required ?? false,
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

    await recordActivityEventInTransaction(tx,context,projectResourceAuditInput("UPDATED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },updated,randomUUID()));
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

    return archived;
  });
}
