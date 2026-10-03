import {
  and,
  asc,
  desc,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectSprints,
  projectTasks,
  projectTaskSubmissions,
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
  projectTaskIdSchema,
  projectTaskSubmissionIdSchema,
  reviewProjectTaskSubmissionInputSchema,
  submitProjectTaskInputSchema,
  type ReviewProjectTaskSubmissionInput,
  type SubmitProjectTaskInput,
} from "./validation";

function mapSubmissionConstraint(error: unknown) {
  const constraint =
    postgresConstraintName(error);

  if (
    constraint ===
      "project_task_submissions_active_uq" ||
    constraint ===
      "project_task_submissions_task_version_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_TASK_SUBMISSION_CONFLICT",
    );
  }

  return error;
}

async function loadTaskForSubmission(
  projectId: string,
  taskIdInput: string,
) {
  const taskId =
    projectTaskIdSchema.parse(taskIdInput);
  const [row] = await getDb()
    .select({
      task: projectTasks,
      sprintStatus: projectSprints.status,
    })
    .from(projectTasks)
    .innerJoin(
      projectSprints,
      eq(projectSprints.id, projectTasks.sprintId),
    )
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(projectTasks.projectId, projectId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_NOT_FOUND",
    );
  }

  return row;
}

export async function submitProjectTask(
  context: RequestContext,
  projectIdInput: string,
  taskIdInput: string,
  rawInput: SubmitProjectTaskInput,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  if (
    scope.access !== "LEARNER" ||
    !context.membership
  ) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_SUBMISSION_ACCESS_DENIED",
    );
  }

  const input =
    submitProjectTaskInputSchema.parse(rawInput);
  const row = await loadTaskForSubmission(
    scope.project.id,
    taskIdInput,
  );

  if (
    row.sprintStatus !== "ACTIVE" ||
    row.task.status === "DONE" ||
    row.task.status === "IN_REVIEW"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_SUBMISSION_INVALID_STATE",
    );
  }

  const [latest] = await getDb()
    .select({
      version: projectTaskSubmissions.version,
    })
    .from(projectTaskSubmissions)
    .where(
      eq(
        projectTaskSubmissions.taskId,
        row.task.id,
      ),
    )
    .orderBy(
      desc(projectTaskSubmissions.version),
    )
    .limit(1);
  const version = (latest?.version ?? 0) + 1;
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [activeSprint] = await tx
        .select({ status: projectSprints.status })
        .from(projectSprints)
        .where(
          eq(
            projectSprints.id,
            row.task.sprintId,
          ),
        )
        .limit(1);

      if (
        !activeSprint ||
        activeSprint.status !== "ACTIVE"
      ) {
        throw new ProjectsServiceError(
          "PROJECT_TASK_SUBMISSION_INVALID_STATE",
        );
      }

      const [task] = await tx
        .update(projectTasks)
        .set({
          status: "IN_REVIEW",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTasks.id, row.task.id),
            ne(projectTasks.status, "DONE"),
            ne(
              projectTasks.status,
              "IN_REVIEW",
            ),
          ),
        )
        .returning();

      if (!task) {
        throw new ProjectsServiceError(
          "PROJECT_TASK_SUBMISSION_INVALID_STATE",
        );
      }

      const [submission] = await tx
        .insert(projectTaskSubmissions)
        .values({
          projectId: scope.project.id,
          taskId: task.id,
          version,
          submittedByMembershipId:
            context.membership!.id,
          submissionUrl: input.submissionUrl,
          note: input.note ?? null,
        })
        .returning();

      return submission;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapSubmissionConstraint(error);
  }
}

export async function reviewProjectTaskSubmission(
  context: RequestContext,
  projectIdInput: string,
  taskIdInput: string,
  submissionIdInput: string,
  rawInput: ReviewProjectTaskSubmissionInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const taskId =
    projectTaskIdSchema.parse(taskIdInput);
  const submissionId =
    projectTaskSubmissionIdSchema.parse(
      submissionIdInput,
    );
  const input =
    reviewProjectTaskSubmissionInputSchema.parse(
      rawInput,
    );

  const [submission] = await getDb()
    .select()
    .from(projectTaskSubmissions)
    .where(
      and(
        eq(
          projectTaskSubmissions.id,
          submissionId,
        ),
        eq(
          projectTaskSubmissions.projectId,
          scope.project.id,
        ),
        eq(
          projectTaskSubmissions.taskId,
          taskId,
        ),
      ),
    )
    .limit(1);

  if (!submission) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_SUBMISSION_NOT_FOUND",
    );
  }

  if (submission.status !== "SUBMITTED") {
    throw new ProjectsServiceError(
      "PROJECT_TASK_SUBMISSION_INVALID_STATE",
    );
  }

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [reviewed] = await tx
      .update(projectTaskSubmissions)
      .set({
        status: input.decision,
        feedback: input.feedback ?? null,
        reviewedByUserId: context.user.id,
        reviewedByMembershipId:
          context.membership?.id ?? null,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            projectTaskSubmissions.id,
            submission.id,
          ),
          eq(
            projectTaskSubmissions.status,
            "SUBMITTED",
          ),
        ),
      )
      .returning();

    if (!reviewed) {
      throw new ProjectsServiceError(
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
      );
    }

    const nextTaskStatus =
      input.decision === "APPROVED"
        ? "DONE"
        : "IN_PROGRESS";

    const [task] = await tx
      .update(projectTasks)
      .set({
        status: nextTaskStatus,
        updatedAt: now,
      })
      .where(
        and(
          eq(projectTasks.id, submission.taskId),
          eq(
            projectTasks.projectId,
            scope.project.id,
          ),
          eq(
            projectTasks.status,
            "IN_REVIEW",
          ),
        ),
      )
      .returning();

    if (!task) {
      throw new ProjectsServiceError(
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
      );
    }

    return { submission: reviewed, task };
  });
}

export async function listProjectTaskSubmissions(
  context: RequestContext,
  projectIdInput: string,
  taskIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const taskId =
    projectTaskIdSchema.parse(taskIdInput);

  const [task] = await getDb()
    .select({ id: projectTasks.id })
    .from(projectTasks)
    .where(
      and(
        eq(projectTasks.id, taskId),
        eq(
          projectTasks.projectId,
          scope.project.id,
        ),
      ),
    )
    .limit(1);

  if (!task) {
    throw new ProjectsServiceError(
      "PROJECT_TASK_NOT_FOUND",
    );
  }

  return getDb()
    .select()
    .from(projectTaskSubmissions)
    .where(
      eq(
        projectTaskSubmissions.taskId,
        task.id,
      ),
    )
    .orderBy(
      asc(projectTaskSubmissions.version),
    );
}
