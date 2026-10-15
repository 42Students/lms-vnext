import {
  and,
  asc,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {readProjectReadinessOverride} from "./readiness-override-service";
import {effectiveProjectSubmissionReady} from "./readiness-override-model";
import {deriveProjectExecutionReadiness} from "./execution-readiness";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { projectDeliveryActivity } from "./delivery-activity-model";
import { projectSubmissionAllowsNewDraft } from "./submission-draft-policy";
import {
  projectInstances,
  projectSubmissionReviews,
  projectDeliveryEvents,
  projectSubmissions,
  projectReleases,
  projectSprints,
  projectTasks,
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
  projectSubmissionDraftInputSchema,
  projectSubmissionIdSchema,
  reviewProjectSubmissionInputSchema,
  type ProjectSubmissionDraftInput,
  type ReviewProjectSubmissionInput,
} from "./validation";

function mapSubmissionConstraint(error: unknown) {
  const constraint =
    postgresConstraintName(error);

  if (
    constraint ===
      "project_submissions_open_project_uq" ||
    constraint ===
      "project_submissions_project_version_uq" ||
    constraint ===
      "project_submission_reviews_submission_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_SUBMISSION_CONFLICT",
    );
  }

  return error;
}

async function requireLearnerSubmissionAccess(
  context: RequestContext,
  projectIdInput: string,
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
      "PROJECT_SUBMISSION_ACCESS_DENIED",
    );
  }

  return {
    ...scope,
    membershipId: context.membership.id,
  };
}

export async function createProjectSubmissionDraft(
  context: RequestContext,
  projectIdInput: string,
  rawInput: ProjectSubmissionDraftInput,
) {
  const scope =
    await requireLearnerSubmissionAccess(
      context,
      projectIdInput,
    );
  const input =
    projectSubmissionDraftInputSchema.parse(rawInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(eq(projectInstances.id, scope.project.id))
        .for("update")
        .limit(1);

      if (!project || (project.status === "ARCHIVED" || project.status === "COMPLETED")) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      const [open] = await tx
        .select({ id: projectSubmissions.id })
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.projectId, scope.project.id),
            inArray(projectSubmissions.status, ["DRAFT", "SUBMITTED"]),
          ),
        )
        .limit(1);

      if (open) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_CONFLICT",
        );
      }

      const [latest] = await tx
        .select({ id: projectSubmissions.id, version: projectSubmissions.version, status: projectSubmissions.status, reopenedAt:projectSubmissions.reopenedAt })
        .from(projectSubmissions)
        .where(eq(projectSubmissions.projectId, scope.project.id))
        .orderBy(desc(projectSubmissions.version))
        .limit(1);
      // Approved deliveries are immutable. A newer version is possible only
      // after an explicit mentor/admin reopen event on that exact approved row.
      const approvedReopened=latest?.status==="APPROVED" && Boolean(latest.reopenedAt);
      if(!projectSubmissionAllowsNewDraft(latest?.status) && !approvedReopened){
        throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
      }
      const version = (latest?.version ?? 0) + 1;

      const [draft] = await tx
        .insert(projectSubmissions)
        .values({
          projectId: scope.project.id,
          version,
          summary: input.summary,
          sourceUrl: input.sourceUrl ?? null,
          demoUrl: input.demoUrl ?? null,
          notes: input.notes ?? null,
          createdByMembershipId: scope.membershipId,
        })
        .returning();

      if (!draft) throw new Error("Project delivery draft insert returned no row");
      await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
        action: "DRAFT_CREATED", collegeId: scope.collegeId,
        organizationId: scope.organizationId, projectId: scope.project.id,
        submissionId: draft.id, version: draft.version,
      }));
      return draft;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) throw error;
    throw mapSubmissionConstraint(error);
  }
}

export async function updateProjectSubmissionDraft(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
  rawInput: ProjectSubmissionDraftInput,
) {
  const scope =
    await requireLearnerSubmissionAccess(
      context,
      projectIdInput,
    );
  const input =
    projectSubmissionDraftInputSchema.parse(rawInput);
  const submissionId =
    projectSubmissionIdSchema.parse(submissionIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("update")
      .limit(1);
    if (!project || project.status === "ARCHIVED") {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    const [submission] = await tx
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.id, submissionId),
          eq(projectSubmissions.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!submission) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_NOT_FOUND",
      );
    }
    if (submission.status !== "DRAFT") {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    const [updated] = await tx
      .update(projectSubmissions)
      .set({
        summary: input.summary,
        sourceUrl: input.sourceUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectSubmissions.id, submission.id),
          eq(projectSubmissions.projectId, scope.project.id),
          eq(projectSubmissions.status, "DRAFT"),
        ),
      )
      .returning();

    if (!updated) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
      action: "DRAFT_UPDATED", collegeId: scope.collegeId,
      organizationId: scope.organizationId, projectId: scope.project.id,
      submissionId: updated.id, version: updated.version,
    }));
    return updated;
  });
}

export async function submitProjectSubmission(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
) {
  const scope =
    await requireLearnerSubmissionAccess(
      context,
      projectIdInput,
    );
  const submissionId =
    projectSubmissionIdSchema.parse(submissionIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("update")
      .limit(1);

    if (!project || project.status === "ARCHIVED") {
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    }
    const [releases,sprints,tasks]=await Promise.all([
      tx.select({status:projectReleases.status}).from(projectReleases)
        .where(eq(projectReleases.projectId,scope.project.id)),
      tx.select({status:projectSprints.status}).from(projectSprints)
        .where(eq(projectSprints.projectId,scope.project.id)),
      tx.select({status:projectTasks.status}).from(projectTasks)
        .where(eq(projectTasks.projectId,scope.project.id)),
    ]);
    const execution=deriveProjectExecutionReadiness({
      projectStatus:project.status,
      releaseStatuses:releases.map(row=>row.status),
      sprintStatuses:sprints.map(row=>row.status),
      taskStatuses:tasks.map(row=>row.status),
    });
    const override=await readProjectReadinessOverride(tx,scope.project.id,scope.collegeId);
    if (!effectiveProjectSubmissionReady(execution.complete,override.state)) {
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    }

    const [submission] = await tx
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.id, submissionId),
          eq(projectSubmissions.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!submission) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_NOT_FOUND",
      );
    }
    if (submission.status !== "DRAFT") {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }
    if (!submission.sourceUrl && !submission.demoUrl) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_CONTENT_REQUIRED",
      );
    }

    const now = new Date();
    const [submitted] = await tx
      .update(projectSubmissions)
      .set({
        status: "SUBMITTED",
        submittedByMembershipId: scope.membershipId,
        submittedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(projectSubmissions.id, submission.id),
          eq(projectSubmissions.projectId, scope.project.id),
          eq(projectSubmissions.status, "DRAFT"),
        ),
      )
      .returning();

    if (!submitted) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
      action: "SUBMITTED", collegeId: scope.collegeId,
      organizationId: scope.organizationId, projectId: scope.project.id,
      submissionId: submitted.id, version: submitted.version,
    }));
    return submitted;
  });
}

export async function reviewProjectSubmission(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
  rawInput: ReviewProjectSubmissionInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const input =
    reviewProjectSubmissionInputSchema.parse(
      rawInput,
    );
  const submissionId =
    projectSubmissionIdSchema.parse(submissionIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(eq(projectInstances.id, scope.project.id))
        .for("update")
        .limit(1);
      if (!project || project.status === "ARCHIVED") {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      const [submission] = await tx
        .select()
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.id, submissionId),
            eq(projectSubmissions.projectId, scope.project.id),
          ),
        )
        .for("update")
        .limit(1);

      if (!submission) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_NOT_FOUND",
        );
      }
      if (submission.status !== "SUBMITTED") {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      const [review] = await tx
        .insert(projectSubmissionReviews)
        .values({
          projectId: scope.project.id,
          submissionId: submission.id,
          decision: input.decision,
          feedback: input.feedback ?? null,
          reviewedByUserId: context.user.id,
          reviewedByMembershipId:
            context.membership?.id ?? null,
        })
        .returning();

      const [updated] = await tx
        .update(projectSubmissions)
        .set({
          status: input.decision,
          ...(input.decision==="APPROVED"?{lockedAt:new Date(),reopenedAt:null}:{}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSubmissions.id, submission.id),
            eq(projectSubmissions.projectId, scope.project.id),
            eq(projectSubmissions.status, "SUBMITTED"),
          ),
        )
        .returning();

      if (!updated) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      if (!review) throw new Error("Project delivery review insert returned no row");
      await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
        action: "REVIEWED", collegeId: scope.collegeId,
        organizationId: scope.organizationId, projectId: scope.project.id,
        submissionId: updated.id, version: updated.version,
        decision: input.decision,
      }));
      if(input.decision==="APPROVED"){
        // Registered 0091 event row is immutable; supersede no prior review.
        if(context.membership?.id){
          await tx.insert(projectDeliveryEvents).values({
            projectId:scope.project.id,submissionId:updated.id,eventType:"LOCKED",
            actorMembershipId:context.membership.id,reason:"Submission approved",
          });
        }
        await recordActivityEventInTransaction(tx,context,projectDeliveryActivity({
          action:"LOCKED",collegeId:scope.collegeId,organizationId:scope.organizationId,
          projectId:scope.project.id,submissionId:updated.id,version:updated.version,
        }));
      }
      return { submission: updated, review };
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapSubmissionConstraint(error);
  }
}

export async function listProjectSubmissions(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const db = getDb();
  const [submissions, reviews] =
    await Promise.all([
      db
        .select()
        .from(projectSubmissions)
        .where(
          eq(
            projectSubmissions.projectId,
            scope.project.id,
          ),
        )
        .orderBy(asc(projectSubmissions.version)),
      db
        .select()
        .from(projectSubmissionReviews)
        .where(
          eq(
            projectSubmissionReviews.projectId,
            scope.project.id,
          ),
        )
        .orderBy(
          asc(
            projectSubmissionReviews.reviewedAt,
          ),
        ),
    ]);

  return { submissions, reviews };
}
