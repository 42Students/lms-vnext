import {
  asc,
  desc,
  eq,
  and,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { readProjectReadinessOverride } from "./readiness-override-service";
import { effectiveProjectSubmissionReady } from "./readiness-override-model";
import {
  projectEvaluations,
  projectReleases,
  projectSprints,
  projectSubmissions,
  projectTasks,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectReadAccess,
} from "./access";

export async function getProjectReadiness(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const projectId = scope.project.id;
  const db = getDb();

  const [
    releases,
    sprints,
    tasks,
    submissionRows,
  ] = await Promise.all([
    db
      .select({ status: projectReleases.status })
      .from(projectReleases)
      .where(
        eq(projectReleases.projectId, projectId),
      )
      .orderBy(asc(projectReleases.sequence)),
    db
      .select({ status: projectSprints.status })
      .from(projectSprints)
      .where(and(eq(projectSprints.projectId, projectId),
        isNull(projectSprints.deletedAt)))
      .orderBy(asc(projectSprints.sequence)),
    db
      .select({ status: projectTasks.status })
      .from(projectTasks)
      .where(and(eq(projectTasks.projectId, projectId),isNull(projectTasks.deletedAt)))
      .orderBy(asc(projectTasks.sequence)),
    db
      .select({
        id: projectSubmissions.id,
        version: projectSubmissions.version,
        status: projectSubmissions.status,
        reopenedAt: projectSubmissions.reopenedAt,
      })
      .from(projectSubmissions)
      .where(
        eq(projectSubmissions.projectId, projectId),
      )
      .orderBy(desc(projectSubmissions.version)),
  ]);

  const latestSubmission =
    submissionRows[0] ?? null;
  const evaluation = latestSubmission
    ? (
        await db
          .select({ id: projectEvaluations.id })
          .from(projectEvaluations)
          .where(
            eq(
              projectEvaluations.submissionId,
              latestSubmission.id,
            ),
          )
          .limit(1)
      )[0] ?? null
    : null;

  const completedSprints = sprints.filter(
    (row) => row.status === "COMPLETED",
  ).length;
  const doneTasks = tasks.filter(
    (row) => row.status === "DONE",
  ).length;
  const shippedReleases = releases.filter(
    (row) => row.status === "SHIPPED",
  ).length;

  const executionComplete =
    // Legacy releases are informational; do not require SHIPPED for submission.
    sprints.length > 0 &&
    tasks.length > 0 &&
    completedSprints === sprints.length &&
    doneTasks === tasks.length &&
    (scope.project.status === "ACTIVE" || scope.project.status === "COMPLETED");

  const hasOpenSubmission =
    latestSubmission?.status === "DRAFT" ||
    latestSubmission?.status === "SUBMITTED";
  const finalApproved =
    latestSubmission?.status === "APPROVED";
  const deliveryReopened=latestSubmission?.status==="APPROVED" && Boolean(latestSubmission.reopenedAt);
  const readinessOverride=await readProjectReadinessOverride(db,projectId,scope.collegeId);

  return {
    projectId,
    projectStatus: scope.project.status,
    readinessOverride,
    execution: {
      complete: executionComplete,
      releases: {
        total: releases.length,
        shipped: shippedReleases,
      },
      sprints: {
        total: sprints.length,
        completed: completedSprints,
      },
      tasks: {
        total: tasks.length,
        done: doneTasks,
      },
    },
    finalSubmission: {
      latest: latestSubmission,
      canCreateDraft:
        scope.project.status !== "ARCHIVED" &&
        !hasOpenSubmission &&
        scope.project.status !== "COMPLETED" &&
        (!finalApproved || deliveryReopened),
      canSubmitDraft:
        effectiveProjectSubmissionReady(executionComplete,readinessOverride.state) &&
        scope.project.status !== "ARCHIVED" &&
        latestSubmission?.status === "DRAFT",
      approved: finalApproved,
      reopened: deliveryReopened,
    },
    evaluation: {
      exists: Boolean(evaluation),
      canEvaluate:
        finalApproved && !evaluation,
    },
  };
}
