import {
  and,
  asc,
  eq,
  inArray,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  projectEvaluationItems,
  projectEvaluations,
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
  createProjectEvaluationInputSchema,
  projectSubmissionIdSchema,
  type CreateProjectEvaluationInput,
} from "./validation";

function mapEvaluationConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "project_evaluations_submission_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_EVALUATION_CONFLICT",
    );
  }

  return error;
}

async function loadApprovedSubmission(
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
        eq(
          projectSubmissions.id,
          submissionId,
        ),
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

  if (submission.status !== "APPROVED") {
    throw new ProjectsServiceError(
      "PROJECT_EVALUATION_INVALID_STATE",
    );
  }

  return submission;
}

export async function createProjectEvaluation(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
  rawInput: CreateProjectEvaluationInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const input =
    createProjectEvaluationInputSchema.parse(
      rawInput,
    );
  const submission =
    await loadApprovedSubmission(
      scope.project.id,
      submissionIdInput,
    );

  const totalScore = input.items.reduce(
    (sum, item) => sum + item.score,
    0,
  );
  const maxScore = input.items.reduce(
    (sum, item) => sum + item.maxScore,
    0,
  );
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [evaluation] = await tx
        .insert(projectEvaluations)
        .values({
          projectId: scope.project.id,
          submissionId: submission.id,
          evaluatorUserId: context.user.id,
          evaluatorMembershipId:
            context.membership?.id ?? null,
          totalScore,
          maxScore,
          summary: input.summary ?? null,
        })
        .returning();

      if (!evaluation) {
        throw new Error(
          "Project evaluation insert returned no row",
        );
      }

      const items = await tx
        .insert(projectEvaluationItems)
        .values(
          input.items.map((item, sequence) => ({
            evaluationId: evaluation.id,
            criterion: item.criterion,
            score: item.score,
            maxScore: item.maxScore,
            feedback: item.feedback ?? null,
            sequence,
          })),
        )
        .returning();

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PROJECTS_EVALUATION_RECORDED,
          collegeId: scope.collegeId,
          organizationId:
            scope.organizationId,
          subjectType:
            "project_evaluation",
          subjectId: evaluation.id,
          subjectLabel:
            scope.project.title,
          summary:
            `Evaluation recorded for ${scope.project.title}`,
          metadata: {
            projectId: scope.project.id,
            submissionId:
              evaluation.submissionId,
            totalScore:
              evaluation.totalScore,
            maxScore:
              evaluation.maxScore,
          },
          groupKey:
            `project:${scope.project.id}:evaluations`,
          dedupeKey:
            `project-evaluation:${evaluation.id}:recorded`,
        },
      );

      return { evaluation, items };
    });
  } catch (error) {
    throw mapEvaluationConstraint(error);
  }
}

export async function getProjectEvaluation(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const submissionId =
    projectSubmissionIdSchema.parse(
      submissionIdInput,
    );

  const [evaluation] = await getDb()
    .select()
    .from(projectEvaluations)
    .where(
      and(
        eq(
          projectEvaluations.projectId,
          scope.project.id,
        ),
        eq(
          projectEvaluations.submissionId,
          submissionId,
        ),
      ),
    )
    .limit(1);

  if (!evaluation) {
    return null;
  }

  const items = await getDb()
    .select()
    .from(projectEvaluationItems)
    .where(
      eq(
        projectEvaluationItems.evaluationId,
        evaluation.id,
      ),
    )
    .orderBy(
      asc(projectEvaluationItems.sequence),
    );

  return { evaluation, items };
}

export async function listProjectEvaluations(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const evaluations = await getDb()
    .select()
    .from(projectEvaluations)
    .where(
      eq(
        projectEvaluations.projectId,
        scope.project.id,
      ),
    )
    .orderBy(
      asc(projectEvaluations.evaluatedAt),
    );

  if (evaluations.length === 0) {
    return {
      evaluations,
      items: [],
    };
  }

  const items = await getDb()
    .select()
    .from(projectEvaluationItems)
    .where(
      inArray(
        projectEvaluationItems.evaluationId,
        evaluations.map(
          (evaluation) => evaluation.id,
        ),
      ),
    )
    .orderBy(
      asc(projectEvaluationItems.evaluationId),
      asc(projectEvaluationItems.sequence),
    );

  return { evaluations, items };
}
