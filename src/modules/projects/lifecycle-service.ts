import {
  and,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectInstances,
  projectReleases,
  projectSprints,
  projectTasks,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireProjectLifecycleAccess,
} from "./access";
import {
  projectReleaseIdSchema,
  projectSprintIdSchema,
  projectTaskIdSchema,
  updateProjectTaskStatusInputSchema,
  type UpdateProjectTaskStatusInput,
} from "./validation";

function mapLifecycleConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "project_sprints_active_project_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_SPRINT_ALREADY_ACTIVE",
    );
  }

  return error;
}

async function loadRelease(
  projectId: string,
  releaseIdInput: string,
) {
  const releaseId =
    projectReleaseIdSchema.parse(releaseIdInput);
  const [release] = await getDb()
    .select()
    .from(projectReleases)
    .where(
      and(
        eq(projectReleases.id, releaseId),
        eq(projectReleases.projectId, projectId),
      ),
    )
    .limit(1);

  if (!release) {
    throw new ProjectsServiceError(
      "PROJECT_RELEASE_NOT_FOUND",
    );
  }

  return release;
}

async function loadSprint(
  projectId: string,
  sprintIdInput: string,
) {
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const [sprint] = await getDb()
    .select()
    .from(projectSprints)
    .where(
      and(
        eq(projectSprints.id, sprintId),
        eq(projectSprints.projectId, projectId),
      ),
    )
    .limit(1);

  if (!sprint) {
    throw new ProjectsServiceError(
      "PROJECT_SPRINT_NOT_FOUND",
    );
  }

  return sprint;
}

async function loadTask(
  projectId: string,
  taskIdInput: string,
) {
  const taskId =
    projectTaskIdSchema.parse(taskIdInput);
  const [task] = await getDb()
    .select()
    .from(projectTasks)
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(projectTasks.projectId, projectId),
      ),
    )
    .limit(1);

  if (!task) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_NOT_FOUND",
    );
  }

  return task;
}

export async function startProjectSprint(
  context: RequestContext,
  projectIdInput: string,
  sprintIdInput: string,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const sprint = await loadSprint(
    scope.project.id,
    sprintIdInput,
  );

  if (sprint.status !== "PLANNED") {
    throw new ProjectsServiceError(
      "PROJECT_SPRINT_INVALID_STATE",
    );
  }

  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [active] = await tx
        .select({ id: projectSprints.id })
        .from(projectSprints)
        .where(
          and(
            eq(
              projectSprints.projectId,
              scope.project.id,
            ),
            eq(projectSprints.status, "ACTIVE"),
            ne(projectSprints.id, sprint.id),
          ),
        )
        .limit(1);

      if (active) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_ALREADY_ACTIVE",
        );
      }

      const [started] = await tx
        .update(projectSprints)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSprints.id, sprint.id),
            eq(projectSprints.status, "PLANNED"),
          ),
        )
        .returning();

      if (!started) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      await tx
        .update(projectReleases)
        .set({
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              projectReleases.id,
              sprint.releaseId,
            ),
            eq(
              projectReleases.status,
              "PLANNED",
            ),
          ),
        );

      await tx
        .update(projectInstances)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              projectInstances.id,
              scope.project.id,
            ),
            eq(
              projectInstances.status,
              "PLANNED",
            ),
          ),
        );

      return started;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapLifecycleConstraint(error);
  }
}

export async function completeProjectSprint(
  context: RequestContext,
  projectIdInput: string,
  sprintIdInput: string,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const sprint = await loadSprint(
    scope.project.id,
    sprintIdInput,
  );

  if (sprint.status !== "ACTIVE") {
    throw new ProjectsServiceError(
      "PROJECT_SPRINT_INVALID_STATE",
    );
  }

  const [openTask] = await getDb()
    .select({ id: projectTasks.id })
    .from(projectTasks)
    .where(
      and(
        eq(projectTasks.sprintId, sprint.id),
        ne(projectTasks.status, "DONE"),
      ),
    )
    .limit(1);

  if (openTask) {
    throw new ProjectsServiceError(
      "PROJECT_SPRINT_HAS_OPEN_TASKS",
    );
  }

  const [completed] = await getDb()
    .update(projectSprints)
    .set({
      status: "COMPLETED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectSprints.id, sprint.id),
        eq(projectSprints.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!completed) {
    throw new ProjectsServiceError(
      "PROJECT_SPRINT_INVALID_STATE",
    );
  }

  return completed;
}

export async function updateProjectTaskStatus(
  context: RequestContext,
  projectIdInput: string,
  taskIdInput: string,
  rawInput: UpdateProjectTaskStatusInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const input =
    updateProjectTaskStatusInputSchema.parse(rawInput);
  const task = await loadTask(
    scope.project.id,
    taskIdInput,
  );

  if (input.status === "IN_REVIEW") {
    throw new ProjectsServiceError(
      "PROJECT_TASK_INVALID_STATE",
    );
  }

  const [sprint] = await getDb()
    .select({
      status: projectSprints.status,
    })
    .from(projectSprints)
    .where(eq(projectSprints.id, task.sprintId))
    .limit(1);

  if (
    !sprint ||
    sprint.status !== "ACTIVE"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_INVALID_STATE",
    );
  }

  if (task.status === "IN_REVIEW") {
    throw new ProjectsServiceError(
      "PROJECT_TASK_INVALID_STATE",
    );
  }

  const [updated] = await getDb()
    .update(projectTasks)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectTasks.id, task.id),
        ne(projectTasks.status, "IN_REVIEW"),
      ),
    )
    .returning();

  if (!updated) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_INVALID_STATE",
    );
  }

  return updated;
}

export async function shipProjectRelease(
  context: RequestContext,
  projectIdInput: string,
  releaseIdInput: string,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const release = await loadRelease(
    scope.project.id,
    releaseIdInput,
  );

  if (
    release.status !== "PLANNED" &&
    release.status !== "IN_PROGRESS"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_RELEASE_INVALID_STATE",
    );
  }

  const [openSprint] = await getDb()
    .select({ id: projectSprints.id })
    .from(projectSprints)
    .where(
      and(
        eq(
          projectSprints.releaseId,
          release.id,
        ),
        ne(
          projectSprints.status,
          "COMPLETED",
        ),
      ),
    )
    .limit(1);

  if (openSprint) {
    throw new ProjectsServiceError(
      "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
    );
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    const [shipped] = await tx
      .update(projectReleases)
      .set({
        status: "SHIPPED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            projectReleases.id,
            release.id,
          ),
          ne(
            projectReleases.status,
            "SHIPPED",
          ),
        ),
      )
      .returning();

    if (!shipped) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    const [unshipped] = await tx
      .select({ id: projectReleases.id })
      .from(projectReleases)
      .where(
        and(
          eq(
            projectReleases.projectId,
            scope.project.id,
          ),
          ne(
            projectReleases.status,
            "SHIPPED",
          ),
        ),
      )
      .limit(1);

    if (!unshipped) {
      await tx
        .update(projectInstances)
        .set({
          status: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(
          eq(
            projectInstances.id,
            scope.project.id,
          ),
        );
    }

    return shipped;
  });
}
