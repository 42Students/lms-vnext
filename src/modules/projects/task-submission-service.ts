import {
  and,
  asc,
  desc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {mentorTaskReviewTokenMatches} from "./mentor-task-review-token-model";
import {learnerProjectTaskReviewNotice} from "./learner-project-review-notification-model";
import {maySubmitAssignedProjectTask} from "./task-assignee-policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { can } from "@/modules/permissions/policy";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  projectMembers,
  inAppNotifications,
  membershipRoles,
  users,
  projectInstances,
  projectSprints,
  projectTasks,
  projectTaskSubmissions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectLifecycleMutationAccess,
  requireProjectReadAccess,
} from "./access";
import {assertPersistedLearnerProjectMutation} from "./learner-mutation-guard";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
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
  const taskId =
    projectTaskIdSchema.parse(taskIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id,scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId),
          isNull(projectInstances.deletedAt)))
        .for("update")
        .limit(1);

      if (!project || project.status !== "ACTIVE") {
        throw new ProjectsServiceError(
          "PROJECT_TASK_SUBMISSION_INVALID_STATE",
        );
      }
      await assertPersistedLearnerProjectMutation(
        tx,context,scope.project.id,scope.collegeId,
      );

      const [task] = await tx
        .select()
        .from(projectTasks)
        .where(
          and(
            eq(projectTasks.id, taskId),
            eq(projectTasks.projectId, scope.project.id),
          ),
        )
        .for("update")
        .limit(1);

      if (!task) {
        throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
      }
      // PR-S2-03: only the persisted, explicitly assigned learner may submit.
      // Null is an unassigned task, not a grant to every project member.
      if (!maySubmitAssignedProjectTask(task.assigneeMembershipId, context.membership?.id ?? null)) {
        throw new ProjectsServiceError("PROJECT_TASK_SUBMISSION_ACCESS_DENIED");
      }

      const [sprint] = await tx
        .select({ status: projectSprints.status })
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.id, task.sprintId!),
            eq(projectSprints.projectId, scope.project.id),
          ),
        )
        .for("update")
        .limit(1);

      if (
        !sprint ||
        sprint.status !== "ACTIVE" ||
        task.status === "DONE" ||
        task.status === "IN_REVIEW"
      ) {
        throw new ProjectsServiceError(
          "PROJECT_TASK_SUBMISSION_INVALID_STATE",
        );
      }

      // The task row lock serializes version allocation and state transition
      // for a task, so two concurrent submissions cannot both win.
      const [latest] = await tx
        .select({
          version: projectTaskSubmissions.version,
        })
        .from(projectTaskSubmissions)
        .where(
          eq(
            projectTaskSubmissions.taskId,
            task.id,
          ),
        )
        .orderBy(
          desc(projectTaskSubmissions.version),
        )
        .limit(1);
      const version = (latest?.version ?? 0) + 1;

      const [updatedTask] = await tx
        .update(projectTasks)
        .set({
          status: "IN_REVIEW",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectTasks.id, task.id),
            eq(projectTasks.projectId, scope.project.id),
            eq(projectTasks.status, task.status),
          ),
        )
        .returning();

      if (!updatedTask) {
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

      if (!submission) {
        throw new ProjectsServiceError("PROJECT_TASK_SUBMISSION_INVALID_STATE");
      }

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PROJECTS_TASK_SUBMITTED,
          collegeId: scope.collegeId,
          organizationId:
            scope.organizationId,
          subjectType:
            "project_task_submission",
          subjectId: submission.id,
          subjectLabel: updatedTask.title,
          summary:
            `${updatedTask.title} submitted for review`,
          metadata: {
            projectId: scope.project.id,
            taskId: updatedTask.id,
            version: submission.version,
            membershipId:
              context.membership!.id,
          },
          groupKey:
            `project:${scope.project.id}:task-submissions`,
          dedupeKey:
            `project-task-submission:${submission.id}:submitted`,
        },
      );

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
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  if (!can(context, "projects.read", {
    collegeId: scope.collegeId,
    organizationId: scope.organizationId,
  })) {
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  }
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
  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId),
        isNull(projectInstances.deletedAt)))
      .for("update")
      .limit(1);

    if (!project || project.status !== "ACTIVE") {
      throw new ProjectsServiceError(
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [submission] = await tx
      .select()
      .from(projectTaskSubmissions)
      .where(
        and(
          eq(projectTaskSubmissions.id, submissionId),
          eq(projectTaskSubmissions.projectId, scope.project.id),
          eq(projectTaskSubmissions.taskId, taskId),
        ),
      )
      .for("update")
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
    if(scope.access==="MENTOR"&&(!input.confirmed||!input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_TASK_SUBMISSION_STALE_VERSION");
    if(input.expectedUpdatedAt&&!mentorTaskReviewTokenMatches(submission.updatedAt,input.expectedUpdatedAt))
      throw new ProjectsServiceError("PROJECT_TASK_SUBMISSION_STALE_VERSION");

    const [task] = await tx
      .select({
        id: projectTasks.id,
        status: projectTasks.status,
      })
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.id, submission.taskId),
          eq(projectTasks.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!task || task.status !== "IN_REVIEW") {
      throw new ProjectsServiceError(
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
      );
    }

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
          eq(projectTaskSubmissions.id, submission.id),
          eq(projectTaskSubmissions.projectId, scope.project.id),
          eq(projectTaskSubmissions.status, "SUBMITTED"),
          input.expectedUpdatedAt?sql`date_trunc('milliseconds', ${projectTaskSubmissions.updatedAt}) =
            ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`:undefined,
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

    const [updatedTask] = await tx
      .update(projectTasks)
      .set({
        status: nextTaskStatus,
        updatedAt: now,
      })
      .where(
        and(
          eq(projectTasks.id, task.id),
          eq(projectTasks.projectId, scope.project.id),
          eq(projectTasks.status, "IN_REVIEW"),
        ),
      )
      .returning();

    if (!updatedTask) {
      throw new ProjectsServiceError(
        "PROJECT_TASK_SUBMISSION_INVALID_STATE",
      );
    }

    // Record the decision in the SAME transaction. A rejected/concurrent
    // re-review cannot create an audit row because the conditional update
    // and the event insertion must both commit.
    const reviewEvent = await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TASK_REVIEWED,
      collegeId: scope.collegeId,
      organizationId: scope.organizationId,
      subjectType: "project_task_submission",
      subjectId: reviewed.id,
      subjectLabel: "Reviewed task submission",
      summary: input.decision === "APPROVED"
        ? "Task submission approved"
        : "Task submission changes requested",
      metadata: {
        projectId: scope.project.id,
        taskId: task.id,
        version: reviewed.version,
        decision: input.decision,
      },
      groupKey: "project:" + scope.project.id + ":task-submissions",
      dedupeKey: "project-task-submission:" + reviewed.id + ":reviewed",
    });
    // Notify only the persisted active learner who authored this submission.
    // The same transaction commits the review, audit and personal bell together.
    const [recipient]=await tx.select({userId:collegeMemberships.userId})
      .from(collegeMemberships)
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER")))
      .innerJoin(projectMembers,and(
        eq(projectMembers.membershipId,collegeMemberships.id),
        eq(projectMembers.projectId,scope.project.id),
        eq(projectMembers.role,"LEARNER"),
        isNull(projectMembers.endedAt),
      ))
      .where(and(eq(collegeMemberships.id,reviewed.submittedByMembershipId),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
      .limit(1);
    if(recipient && recipient.userId!==context.user.id){
      const notice=learnerProjectTaskReviewNotice({
        projectId:scope.project.id,taskId:task.id,decision:input.decision,
      });
      await tx.insert(inAppNotifications).values({
        eventId:reviewEvent.id,userId:recipient.userId,
        title:notice.title,body:notice.body,actionHref:notice.actionHref,
      }).onConflictDoNothing();
    }
    return { submission: reviewed, task: updatedTask };
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

export async function listProjectTaskSubmissionsForProject(
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
    .from(projectTaskSubmissions)
    .where(
      eq(
        projectTaskSubmissions.projectId,
        scope.project.id,
      ),
    )
    .orderBy(
      asc(projectTaskSubmissions.taskId),
      asc(projectTaskSubmissions.version),
    );
}
