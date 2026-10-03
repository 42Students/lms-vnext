import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
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

async function loadActiveResource(
  projectId: string,
  resourceIdInput: string,
) {
  const resourceId =
    projectResourceIdSchema.parse(resourceIdInput);
  const [resource] = await getDb()
    .select()
    .from(projectResources)
    .where(
      and(
        eq(projectResources.id, resourceId),
        eq(projectResources.projectId, projectId),
        eq(projectResources.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!resource) {
    throw new ProjectsServiceError(
      "PROJECT_RESOURCE_NOT_FOUND",
    );
  }

  return resource;
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
  ensureMutableProject(scope.project.status);

  const input =
    createProjectResourceInputSchema.parse(
      rawInput,
    );

  const [latest] = await getDb()
    .select({ sequence: projectResources.sequence })
    .from(projectResources)
    .where(
      eq(
        projectResources.projectId,
        scope.project.id,
      ),
    )
    .orderBy(desc(projectResources.sequence))
    .limit(1);

  try {
    const [resource] = await getDb()
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

    return resource;
  } catch (error) {
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
  ensureMutableProject(scope.project.status);

  const input =
    updateProjectResourceInputSchema.parse(
      rawInput,
    );
  const resource = await loadActiveResource(
    scope.project.id,
    resourceIdInput,
  );

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

  const [updated] = await getDb()
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
        eq(projectResources.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!updated) {
    throw new ProjectsServiceError(
      "PROJECT_RESOURCE_NOT_FOUND",
    );
  }

  return updated;
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
  ensureMutableProject(scope.project.status);

  const resource = await loadActiveResource(
    scope.project.id,
    resourceIdInput,
  );

  const [archived] = await getDb()
    .update(projectResources)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectResources.id, resource.id),
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
}
