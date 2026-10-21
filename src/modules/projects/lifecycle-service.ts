import { randomUUID } from "node:crypto";
import {
  and,
  eq,
  ne,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { mayCloseProjectSprint } from "./sprint-close-policy";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { allowedMentorTaskTransition } from "./mentor-task-transition-model";
import {
  projectInstances,
  projectReleases,
  projectSprints,
  projectTasks,
  projectMembers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireProjectLifecycleMutationAccess,
} from "./access";
import {
  projectReleaseIdSchema,
  projectReleaseVersionInputSchema,
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

function projectAllowsExecution(status: string) {
  return status !== "ARCHIVED" && status !== "COMPLETED";
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
        isNull(projectSprints.deletedAt),
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
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update")
        .limit(1);

      if (!project || !projectAllowsExecution(project.status)) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }
      await assertPersistedProjectMutationActor(tx,context,scope);

      const [primary] = await tx.select({ id: projectMembers.id })
        .from(projectMembers).where(and(
          eq(projectMembers.projectId, scope.project.id),
          eq(projectMembers.role, "MENTOR"),
          eq(projectMembers.isPrimary, true),
          isNull(projectMembers.endedAt),
        )).limit(1);
      if (!primary) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");

      const [sprint] = await tx
        .select()
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.id, sprintId),
            eq(projectSprints.projectId, scope.project.id),
            isNull(projectSprints.deletedAt),
          ),
        )
        .for("update")
        .limit(1);

      if (!sprint) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_NOT_FOUND",
        );
      }
      if (sprint.status !== "PLANNED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

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
            isNull(projectSprints.deletedAt),
            ne(projectSprints.id, sprint.id),
          ),
        )
        .for("update")
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
            eq(projectReleases.id, sprint.releaseId),
            eq(projectReleases.projectId, scope.project.id),
            eq(projectReleases.status, "PLANNED"),
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
            eq(projectInstances.id, scope.project.id),
            eq(projectInstances.status, "PLANNED"),
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
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project || !projectAllowsExecution(project.status)) {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [sprint] = await tx
      .select()
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.id, sprintId),
          eq(projectSprints.projectId, scope.project.id),
          isNull(projectSprints.deletedAt),
        ),
      )
      .for("update")
      .limit(1);

    if (!sprint) {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_NOT_FOUND",
      );
    }
    if (sprint.status !== "ACTIVE") {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_INVALID_STATE",
      );
    }

    const [openTask] = await tx
      .select({ id: projectTasks.id })
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.projectId, scope.project.id),
          eq(projectTasks.sprintId, sprint.id),
          ne(projectTasks.status, "DONE"),
        ),
      )
      .for("update")
      .limit(1);

    if(openTask){
      // Migration 0110: carry incomplete work into the product backlog.
      const carried = await tx.update(projectTasks).set({
        sprintId:null,carriedFromSprintId:sprint.id,
        carriedOverAt:new Date(),updatedAt:new Date(),
      }).where(and(eq(projectTasks.projectId,scope.project.id),
        eq(projectTasks.sprintId,sprint.id),ne(projectTasks.status,"DONE"))).returning({id:projectTasks.id});
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
        summary:"Unfinished sprint tasks carried to product backlog",
        metadata:{projectId:scope.project.id,sprintId:sprint.id,carriedCount:carried.length},
        groupKey:"project:"+scope.project.id,
      });
    }

    const [completed] = await tx
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
  });
}

export async function reopenProjectSprint(
  context: RequestContext,
  projectIdInput: string,
  sprintIdInput: string,
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update")
        .limit(1);

      if (!project || project.status === "ARCHIVED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }
      await assertPersistedProjectMutationActor(tx,context,scope);

      const [sprint] = await tx
        .select()
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.id, sprintId),
            eq(projectSprints.projectId, scope.project.id),
            isNull(projectSprints.deletedAt),
          ),
        )
        .for("update")
        .limit(1);

      if (!sprint) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_NOT_FOUND",
        );
      }
      if (sprint.status !== "COMPLETED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      const [release] = await tx
        .select({ status: projectReleases.status })
        .from(projectReleases)
        .where(
          and(
            eq(projectReleases.id, sprint.releaseId),
            eq(projectReleases.projectId, scope.project.id),
          ),
        )
        .for("update")
        .limit(1);

      if (!release || release.status === "SHIPPED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      const [activeSibling] = await tx
        .select({ id: projectSprints.id })
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.projectId, scope.project.id),
            eq(projectSprints.status, "ACTIVE"),
            isNull(projectSprints.deletedAt),
            ne(projectSprints.id, sprint.id),
          ),
        )
        .for("update")
        .limit(1);

      if (activeSibling) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_ALREADY_ACTIVE",
        );
      }

      const [reopened] = await tx
        .update(projectSprints)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSprints.id, sprint.id),
            eq(projectSprints.status, "COMPLETED"),
          ),
        )
        .returning();

      if (!reopened) {
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
            eq(projectReleases.id, sprint.releaseId),
            ne(projectReleases.status, "SHIPPED"),
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
            eq(projectInstances.id, scope.project.id),
            ne(projectInstances.status, "ARCHIVED"),
          ),
        );

      return reopened;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapLifecycleConstraint(error);
  }
}

export async function updateProjectTaskStatus(
  context: RequestContext,
  projectIdInput: string,
  taskIdInput: string,
  rawInput: UpdateProjectTaskStatusInput,
) {
  const scope = await requireProjectLifecycleMutationAccess(context, projectIdInput);
  const input = updateProjectTaskStatusInputSchema.parse(rawInput);
  const taskId = projectTaskIdSchema.parse(taskIdInput);

  return getDb().transaction(async (tx) => {
    const [project] = await tx.select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if (!project || !projectAllowsExecution(project.status)) {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    // Read inside the transaction; the sprint lock and task recheck protect
    // against concurrently moving or completing a task.
    const [candidate] = await tx.select({ sprintId: projectTasks.sprintId })
      .from(projectTasks)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, scope.project.id)))
      .limit(1);
    if (!candidate) throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if (candidate.sprintId === null) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    const [sprint] = await tx.select({ status: projectSprints.status })
      .from(projectSprints)
      .where(and(eq(projectSprints.id, candidate.sprintId), eq(projectSprints.projectId, scope.project.id),
        isNull(projectSprints.deletedAt)))
      .for("update").limit(1);
    if (!sprint || sprint.status !== "ACTIVE") {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }

    const [lockedTask] = await tx.select()
      .from(projectTasks)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, scope.project.id)))
      .for("update").limit(1);
    if (!lockedTask || lockedTask.sprintId !== candidate.sprintId ||
        !allowedMentorTaskTransition(lockedTask.status, input.status) ||
        lockedTask.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }

    // 0090: entering BLOCKED requires a persisted blocker reason.
    if (input.status==="BLOCKED" && !lockedTask.blockerReason?.trim())
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const now = new Date(Math.max(Date.now(), lockedTask.updatedAt.getTime() + 1));
    const [updated] = await tx.update(projectTasks).set({
      status: input.status,
      updatedAt: now,
    }).where(and(
      eq(projectTasks.id, lockedTask.id),
      eq(projectTasks.projectId, scope.project.id),
      eq(projectTasks.status, lockedTask.status),
      sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
    )).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TASK_STATUS_CHANGED,
      collegeId: scope.collegeId,
      organizationId: scope.organizationId,
      subjectType: "project_task",
      subjectId: updated.id,
      subjectLabel: updated.title,
      summary: "Project task status changed",
      metadata: {
        projectId: scope.project.id,
        taskId: updated.id,
        previousStatus: lockedTask.status,
        nextStatus: updated.status,
        reviewRequiredForDone: true,
      },
      groupKey: "project:" + scope.project.id,
      dedupeKey: "project-task:" + updated.id + ":status:" + randomUUID(),
    });
    return updated;
  });
}

export async function unshipProjectRelease(
  context: RequestContext,
  projectIdInput: string,
  releaseIdInput: string,
  rawInput:unknown={},
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const expected=projectReleaseVersionInputSchema.parse(rawInput).expectedUpdatedAt;
  if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
  const releaseId =
    projectReleaseIdSchema.parse(releaseIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project || project.status === "ARCHIVED") {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [release] = await tx
      .select()
      .from(projectReleases)
      .where(
        and(
          eq(projectReleases.id, releaseId),
          eq(projectReleases.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!release) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_NOT_FOUND",
      );
    }
    if(expected && release.updatedAt.getTime()!==new Date(expected).getTime())
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    if (release.status !== "SHIPPED") {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    const [startedSprint] = await tx
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.projectId, scope.project.id),
          eq(projectSprints.releaseId, release.id),
          isNull(projectSprints.deletedAt),
          ne(projectSprints.status, "PLANNED"),
        ),
      )
      .for("update")
      .limit(1);

    const nextStatus =
      startedSprint ? "IN_PROGRESS" : "PLANNED";

    const [unshipped] = await tx
      .update(projectReleases)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectReleases.id, release.id),
          eq(projectReleases.projectId, scope.project.id),
          eq(projectReleases.status, "SHIPPED"),
        ),
      )
      .returning();

    if (!unshipped) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    await tx
      .update(projectInstances)
      .set({
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectInstances.id, scope.project.id),
          eq(projectInstances.status, "COMPLETED"),
        ),
      );

    return unshipped;
  });
}

export async function shipProjectRelease(
  context: RequestContext,
  projectIdInput: string,
  releaseIdInput: string,
  rawInput:unknown={},
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const expected=projectReleaseVersionInputSchema.parse(rawInput).expectedUpdatedAt;
  if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
  const releaseId =
    projectReleaseIdSchema.parse(releaseIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project || !projectAllowsExecution(project.status)) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [release] = await tx
      .select()
      .from(projectReleases)
      .where(
        and(
          eq(projectReleases.id, releaseId),
          eq(projectReleases.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!release) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_NOT_FOUND",
      );
    }
    if(expected && release.updatedAt.getTime()!==new Date(expected).getTime())
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    if (
      release.status !== "PLANNED" &&
      release.status !== "IN_PROGRESS"
    ) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    // A planned release with zero sprints cannot be shipped as completed work.
    const [firstSprint] = await tx
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(and(
        eq(projectSprints.projectId, scope.project.id),
        eq(projectSprints.releaseId, release.id),
      isNull(projectSprints.deletedAt),
      ))
      .limit(1);
    if (!firstSprint) {
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    }

    const [openSprint] = await tx
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.projectId, scope.project.id),
          eq(projectSprints.releaseId, release.id),
          isNull(projectSprints.deletedAt),
          ne(projectSprints.status, "COMPLETED"),
        ),
      )
      .for("update")
      .limit(1);

    if (openSprint) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
      );
    }

    const [shipped] = await tx
      .update(projectReleases)
      .set({
        status: "SHIPPED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectReleases.id, release.id),
          eq(projectReleases.projectId, scope.project.id),
          eq(projectReleases.status, release.status),
        ),
      )
      .returning();

    if (!shipped) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    // Shipping finishes the release; only the approved mentor closeout
    // workflow may transition the project to COMPLETED.

    return shipped;
  });
}

/** Legacy ProjectWorkspaceService transition crosswalk. The admin and
 * mentor writers are distinct audited paths: do not call both per action. */
export const LEGACY_PROJECT_SPRINT_TRANSITIONS = {
 startSprint:{from:"PLANNED",to:"ACTIVE",adminWriter:"startProjectSprint",mentorAction:"START"},
 completeSprint:{from:"ACTIVE",to:"COMPLETED",adminWriter:"completeProjectSprint",mentorAction:"COMPLETE"},
 reopenSprint:{from:"COMPLETED",to:"ACTIVE",adminWriter:"reopenProjectSprint",mentorAction:"REOPEN"},
} as const;
