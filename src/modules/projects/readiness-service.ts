import {
  asc,
  desc,
  eq,
  and,
  isNull,
  sql,
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
  projectTaskSubmissions,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectReadAccess,
} from "./access";

/** The legacy snapshot treated DONE and COMPLET* as finished. Imported
 * project tasks are normalized to DONE by the canonical DB constraint, but
 * keep this read adapter for archived imports and future source adapters.
 * Do not count INCOMPLETE as completed merely because it contains COMPLET.
 */
export function projectTaskReadinessIsComplete(status:string|null|undefined):boolean{
 const normalized=(status??"").trim().toUpperCase();
 return normalized==="DONE"||normalized==="COMPLETE"||normalized==="COMPLETED"||
  normalized.startsWith("COMPLET_")||normalized.endsWith("_COMPLETED");
}

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
    proofRows,
  ] = await Promise.all([
    db
      .select({ status: projectReleases.status })
      .from(projectReleases)
      .where(and(eq(projectReleases.projectId, projectId),
           isNull(projectReleases.deletedAt)))
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
    db.select({covered:sql<number>`count(distinct ${projectTaskSubmissions.taskId})::integer`})
      .from(projectTaskSubmissions)
      .innerJoin(projectTasks,eq(projectTasks.id,projectTaskSubmissions.taskId))
      .where(and(eq(projectTaskSubmissions.projectId,projectId),
        eq(projectTasks.projectId,projectId),
        sql`(upper(${projectTasks.status})='DONE' or upper(${projectTasks.status}) like 'COMPLET%')`,
        isNull(projectTasks.deletedAt),
        sql`length(trim(${projectTaskSubmissions.submissionUrl})) > 0`)),
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
    (row) => projectTaskReadinessIsComplete(row.status),
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
  const priorFinalSubmission=Boolean(latestSubmission&&latestSubmission.status!=="DRAFT");
  const readyForSubmission=scope.project.status!=="ARCHIVED"&&
    effectiveProjectSubmissionReady(executionComplete,readinessOverride.state,priorFinalSubmission);
  const proofCovered=Math.min(doneTasks,Number(proofRows[0]?.covered??0));
  // Legacy flat DTO is an explicit compatibility projection only: the vNext
  // nested execution model stays authoritative. Proof is informational, not
  // secretly a prerequisite; releases do not gate submission.
  const legacyReadiness={
    readyForSubmission,
    readinessState:readyForSubmission?"READY" as const:"NOT_READY" as const,
    reason:priorFinalSubmission?"A final submission has already been recorded.":
      scope.project.status==="ARCHIVED"?"Archived workspaces cannot submit.":
      readinessOverride.state==="FORCE_BLOCK"?"Submission blocked by an administrator.":
      readinessOverride.state==="FORCE_UNLOCK"?"Submission unlocked by an administrator.":
      !sprints.length?"Add a sprint before submitting.":
      !tasks.length?"Add tasks before submitting.":
      !executionComplete?"Complete all tasks and sprints before submitting.":null,
    totalSprints:sprints.length,completedSprints,
    totalTasks:tasks.length,completedTasks:doneTasks,
    totalReleases:releases.length,shippedReleases,
    proofCoverage:{covered:proofCovered,completedTasks:doneTasks,
      unknown:doneTasks>proofCovered},
    // Task/sprint status is the required readiness signal. Optional proof
    // links and release shipping are advisory, never disguised as unknown
    // *required* evidence or silently added to the submission gate.
    advisoryWarnings:[
      ...(doneTasks>proofCovered?[
        (doneTasks-proofCovered)+" completed tasks have no recorded proof link."
      ]:[]),
      ...(releases.length>shippedReleases?[
        (releases.length-shippedReleases)+" releases have not shipped (informational)."
      ]:[]),
    ],
    requiredEvidence:{
      tasksStatusKnown:true,sprintsStatusKnown:true,
      complete:executionComplete,
    },
    submissionExists:latestSubmission!==null,
    submissionStatus:latestSubmission?.status??null,
    overrideActive:readinessOverride.state==="FORCE_UNLOCK"||
      readinessOverride.state==="FORCE_BLOCK",
    overrideValue:readinessOverride.state==="FORCE_UNLOCK"?true:
      readinessOverride.state==="FORCE_BLOCK"?false:null,
    overrideNote:readinessOverride.note,
    overrideByName:readinessOverride.overriddenBy,
    overrideAt:readinessOverride.occurredAt?.toISOString()??null,
  };

  return {
    legacyReadiness,
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
        proofCovered: Math.min(doneTasks,Number(proofRows[0]?.covered??0)),
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
