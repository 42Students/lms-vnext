import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  membershipRoles,
  projectMembers,
  users,
  projectEvaluationItems,
  projectEvaluations,
  projectSubmissionReviews,
  projectDeliveryEvents,
  projectInstances,
  projectSubmissions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { assertPersistedPlatformPermission, type PermissionTransaction } from "@/modules/permissions/persisted-actor";
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

/** A rubric is permanent academic evidence. The initial request context may
 * become stale while a reviewer is completing a score sheet: reauthorize with
 * persisted rows and SHARE locks inside the write transaction. */
export async function assertCurrentEvaluationActor(
  tx: PermissionTransaction,
  context: RequestContext,
  scope: { project: {id:string}; collegeId:string; organizationId:string; access:"ADMIN"|"MENTOR" },
) {
  if (scope.access === "ADMIN") {
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      collegeId:scope.collegeId,organizationId:scope.organizationId,
    });
    return;
  }
  const membership=context.membership;
  if (!membership || membership.collegeId!==scope.collegeId ||
      membership.organizationId!==scope.organizationId) {
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  }
  const [persistedMentor]=await tx.select({id:projectMembers.id})
    .from(projectMembers)
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,projectMembers.membershipId),
      eq(collegeMemberships.collegeId,scope.collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
    ))
    .innerJoin(users,and(
      eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"MENTOR"),
    ))
    .where(and(
      eq(projectMembers.projectId,scope.project.id),
      eq(projectMembers.membershipId,membership.id),
      eq(projectMembers.role,"MENTOR"),
      isNull(projectMembers.endedAt),
    )).for("share").limit(1);
  if(!persistedMentor)throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
}

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
  // The lifecycle service guards this already, but capture a narrowed access
  // value so the transactional persisted-actor check cannot accidentally be
  // called with a learner if a future read-access union expands.
  const evaluatorAccess=scope.access;
  if(evaluatorAccess!=="ADMIN"&&evaluatorAccess!=="MENTOR")
    throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
  const input =
    createProjectEvaluationInputSchema.parse(
      rawInput,
    );
  const submissionId =
    projectSubmissionIdSchema.parse(
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
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(eq(projectInstances.id, scope.project.id))
        .for("update")
        .limit(1);

      if (!project || project.status === "ARCHIVED" || project.status === "COMPLETED") {
        throw new ProjectsServiceError(
          "PROJECT_EVALUATION_INVALID_STATE",
        );
      }
      await assertCurrentEvaluationActor(tx,context,{
        project:{id:scope.project.id},
        collegeId:scope.collegeId,
        organizationId:scope.organizationId,
        access:evaluatorAccess,
      });

      const [submission] = await tx
        .select({
          id: projectSubmissions.id,
          status: projectSubmissions.status,
        })
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
      if (submission.status !== "APPROVED") {
        throw new ProjectsServiceError(
          "PROJECT_EVALUATION_INVALID_STATE",
        );
      }

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
    if (error instanceof ProjectsServiceError) throw error;
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
  // Rubric scores are internal until a dedicated, audited release decision exists.
  // Approval of a delivery is not publication of its evaluation.
  if (scope.access !== "ADMIN" && scope.access !== "MENTOR") {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }

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

  // Evidence remains scoped to the same authorized project and submission.
  // Preserve original versions, reviewer identity, decisions and attachment
  // provenance without interpreting a file storage key as public access.
  const [items,submissionRows,reviewRows,events] = await Promise.all([
    getDb().select().from(projectEvaluationItems)
      .where(eq(projectEvaluationItems.evaluationId,evaluation.id))
      .orderBy(asc(projectEvaluationItems.sequence)),
    getDb().select({
      id:projectSubmissions.id,version:projectSubmissions.version,
      status:projectSubmissions.status,submittedAt:projectSubmissions.submittedAt,
      submittedByMembershipId:projectSubmissions.submittedByMembershipId,
      attachments:projectSubmissions.attachments,
      sourceUrl:projectSubmissions.sourceUrl,demoUrl:projectSubmissions.demoUrl,
      legacyDeliveryId:projectSubmissions.legacyDeliveryId,
      legacyOptimisticVersion:projectSubmissions.legacyOptimisticVersion,
      legacyRevisionCount:projectSubmissions.legacyRevisionCount,
      legacyReviewStatus:projectSubmissions.legacyReviewStatus,
      legacyFileName:projectSubmissions.legacyFileName,
      legacyFileSize:projectSubmissions.legacyFileSize,
      legacyMimeType:projectSubmissions.legacyMimeType,
    }).from(projectSubmissions).where(and(
      eq(projectSubmissions.id,submissionId),
      eq(projectSubmissions.projectId,scope.project.id),
    )).limit(1),
    getDb().select({
      decision:projectSubmissionReviews.decision,
      feedback:projectSubmissionReviews.feedback,
      reviewedByUserId:projectSubmissionReviews.reviewedByUserId,
      reviewedByMembershipId:projectSubmissionReviews.reviewedByMembershipId,
      reviewedAt:projectSubmissionReviews.reviewedAt,
    }).from(projectSubmissionReviews).where(and(
      eq(projectSubmissionReviews.projectId,scope.project.id),
      eq(projectSubmissionReviews.submissionId,submissionId),
    )).limit(1),
    getDb().select({
      eventType:projectDeliveryEvents.eventType,
      actorMembershipId:projectDeliveryEvents.actorMembershipId,
      reason:projectDeliveryEvents.reason,
      occurredAt:projectDeliveryEvents.occurredAt,
      legacyAction:projectDeliveryEvents.legacyAction,
      legacyStatus:projectDeliveryEvents.legacyStatus,
      legacyActorId:projectDeliveryEvents.legacyActorId,
      legacyActorName:projectDeliveryEvents.legacyActorName,
      legacyActorType:projectDeliveryEvents.legacyActorType,
      legacyNotes:projectDeliveryEvents.legacyNotes,
      legacyAttachmentUrl:projectDeliveryEvents.legacyAttachmentUrl,
      legacyFeedback:projectDeliveryEvents.legacyFeedback,
      legacyRevisionCount:projectDeliveryEvents.legacyRevisionCount,
    }).from(projectDeliveryEvents).where(and(
      eq(projectDeliveryEvents.projectId,scope.project.id),
      eq(projectDeliveryEvents.submissionId,submissionId),
    )).orderBy(asc(projectDeliveryEvents.occurredAt)).limit(201),
  ]);
  const submission=submissionRows[0]??null;
  return {
    evaluation,items,
    evidence:{
      submission:submission?{
        id:submission.id,version:submission.version,status:submission.status,
        submittedAt:submission.submittedAt,
        submittedByMembershipId:submission.submittedByMembershipId,
        legacyDeliveryId:submission.legacyDeliveryId,
        legacyOptimisticVersion:submission.legacyOptimisticVersion,
        legacyRevisionCount:submission.legacyRevisionCount,
        legacyReviewStatus:submission.legacyReviewStatus,
      }:null,
      review:reviewRows[0]??null,
      attachments:submission?.attachments??[],
      legacyFile:submission?.legacyFileName?{
        name:submission.legacyFileName,size:submission.legacyFileSize,
        mimeType:submission.legacyMimeType,
      }:null,
      sourceUrl:submission?.sourceUrl??null,
      demoUrl:submission?.demoUrl??null,
      events:events.slice(0,200),
      eventsTruncated:events.length>200,
    },
  };
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
  // Rubric scores are internal until a dedicated, audited release decision exists.
  // Approval of a delivery is not publication of its evaluation.
  if (scope.access !== "ADMIN" && scope.access !== "MENTOR") {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }

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
