import {
  and,
  asc,
  desc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  projectSubmissionReviews,
  projectSubmissions,
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

async function loadSubmission(
  projectId: string,
  submissionIdInput: string,
) {
  const submissionId =
    projectSubmissionIdSchema.parse(
      submissionIdInput,
    );
  const [submission] = await getDb()
    .select()
    .from(projectSubmissions)
    .where(
      and(
        eq(projectSubmissions.id, submissionId),
        eq(
          projectSubmissions.projectId,
          projectId,
        ),
      ),
    )
    .limit(1);

  if (!submission) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_NOT_FOUND",
    );
  }

  return submission;
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

  if (scope.project.status === "ARCHIVED") {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_INVALID_STATE",
    );
  }

  const [open] = await getDb()
    .select({ id: projectSubmissions.id })
    .from(projectSubmissions)
    .where(
      and(
        eq(
          projectSubmissions.projectId,
          scope.project.id,
        ),
        inArray(projectSubmissions.status, [
          "DRAFT",
          "SUBMITTED",
        ]),
      ),
    )
    .limit(1);

  if (open) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_CONFLICT",
    );
  }

  const [latest] = await getDb()
    .select({ version: projectSubmissions.version })
    .from(projectSubmissions)
    .where(
      eq(
        projectSubmissions.projectId,
        scope.project.id,
      ),
    )
    .orderBy(desc(projectSubmissions.version))
    .limit(1);
  const version = (latest?.version ?? 0) + 1;

  try {
    const [draft] = await getDb()
      .insert(projectSubmissions)
      .values({
        projectId: scope.project.id,
        version,
        summary: input.summary,
        sourceUrl: input.sourceUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        notes: input.notes ?? null,
        createdByMembershipId:
          scope.membershipId,
      })
      .returning();

    return draft;
  } catch (error) {
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
  const submission = await loadSubmission(
    scope.project.id,
    submissionIdInput,
  );

  if (submission.status !== "DRAFT") {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_INVALID_STATE",
    );
  }

  const [updated] = await getDb()
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
        eq(projectSubmissions.status, "DRAFT"),
      ),
    )
    .returning();

  if (!updated) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_INVALID_STATE",
    );
  }

  return updated;
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
  const submission = await loadSubmission(
    scope.project.id,
    submissionIdInput,
  );

  if (
    scope.project.status !== "COMPLETED" ||
    submission.status !== "DRAFT"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_INVALID_STATE",
    );
  }

  if (
    !submission.sourceUrl &&
    !submission.demoUrl
  ) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_CONTENT_REQUIRED",
    );
  }

  const now = new Date();
  const [submitted] = await getDb()
    .update(projectSubmissions)
    .set({
      status: "SUBMITTED",
      submittedByMembershipId:
        scope.membershipId,
      submittedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(projectSubmissions.id, submission.id),
        eq(projectSubmissions.status, "DRAFT"),
      ),
    )
    .returning();

  if (!submitted) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_INVALID_STATE",
    );
  }

  return submitted;
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
  const submission = await loadSubmission(
    scope.project.id,
    submissionIdInput,
  );

  if (submission.status !== "SUBMITTED") {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_INVALID_STATE",
    );
  }

  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
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
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              projectSubmissions.id,
              submission.id,
            ),
            eq(
              projectSubmissions.status,
              "SUBMITTED",
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
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
