import {
  and,
  asc,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationScreeningHistory,
  placementApplicationScreenings,
  placementJobRoleOptions,
  placementJobs,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  placementApplicationIdSchema,
  placementJobIdSchema,
  placementScreeningDecisionInputSchema,
  type PlacementScreeningDecisionInput,
} from "./validation";

type ScreeningStatus =
  | "PENDING"
  | "HOLD"
  | "SHORTLISTED"
  | "REJECTED";

/** vNext keeps a human disposition separate from the legacy automatic
 * numeric screening run. Never display an invented score or rank candidates
 * without persisted evidence and explainable component scores. */
export const PLACEMENT_SCREENING_PROVENANCE = {
  mode: "MANUAL_REVIEW",
  version: "human-v1",
  scoreAvailable: false,
  missingScoreLabel: "Not scored",
  completionLabel: "Human review decision",
  // Legacy AUTOMATED_V1 numeric score was not migrated; never fabricate it.
  automaticScoringEnabled: false,
  automatedStatus: "NOT_RUN",
  overallScore: null,
  skillsScore: null,
  educationScore: null,
  screenedAt: null,
  rankingPolicy: "SUBMISSION_TIME",
  rescreenPolicy: "MANAGER_REPAIR_ONLY",
} as const;

/** The legacy single status is split across persisted vNext facts. A
 * manual screening decision never invents a round, offer, or joining. */
export const PLACEMENT_SCREENING_LEGACY_STAGE_SOURCES = {
  APPLIED: "SUBMITTED_APPLICATION",
  SHORTLISTED: "HUMAN_SCREENING",
  ASSESSMENT: "APPLICATION_TEST_ROUND",
  INTERVIEW: "APPLICATION_INTERVIEW_ROUND",
  OFFERED: "PERSISTED_OFFER",
  REJECTED: "HUMAN_SCREENING_OR_PIPELINE",
  HIRED: "VERIFIED_JOINING",
} as const;

async function loadScreeningDetails(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      screening: placementApplicationScreenings,
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: placementJobs,
      candidate: {
        membershipId: collegeMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
      },
    })
    .from(placementApplicationScreenings)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementApplicationScreenings.applicationId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      eq(
        placementApplicationScreenings.applicationId,
        applicationId,
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_SCREENING_NOT_FOUND",
    );
  }
  return row;
}

async function loadScreeningHistory(
  applicationId: string,
) {
  return getDb()
    .select()
    .from(placementApplicationScreeningHistory)
    .where(
      eq(
        placementApplicationScreeningHistory.applicationId,
        applicationId,
      ),
    )
    .orderBy(
      asc(
        placementApplicationScreeningHistory.createdAt,
      ),
    );
}

function learnerScreeningView(
  row: Awaited<
    ReturnType<typeof loadScreeningDetails>
  >,
) {
  const status = row.screening.status as ScreeningStatus;
  const publicStatus =
    status === "PENDING" || status === "HOLD"
      ? "UNDER_REVIEW"
      : status;

  return {
    applicationId: row.application.id,
    status: publicStatus,
    candidateMessage:
      status === "SHORTLISTED" ||
      status === "REJECTED"
        ? row.screening.candidateMessage
        : null,
    decidedAt:
      status === "SHORTLISTED" ||
      status === "REJECTED"
        ? row.screening.decidedAt
        : null,
    updatedAt: row.screening.updatedAt,
    screeningMode: PLACEMENT_SCREENING_PROVENANCE.mode,
    screeningVersion: PLACEMENT_SCREENING_PROVENANCE.version,
    automatedScreeningStatus: "NOT_RUN" as const,
    automatedScreeningScore: null,
  };
}

export async function listPlacementScreeningQueue(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId = placementJobIdSchema.parse(jobIdInput);
  const [job] = await getDb()
    .select()
    .from(placementJobs)
    .where(eq(placementJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_NOT_FOUND",
    );
  }
  await requirePlacementManageScope(
    context,
    job.collegeId,
  );

  return getDb()
    .select({
      screening: placementApplicationScreenings,
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      candidate: {
        membershipId: collegeMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        phoneE164: users.phoneE164,
      },
    })
    .from(placementApplicationScreenings)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementApplicationScreenings.applicationId,
      ),
    )
    .innerJoin(
      placementJobRoleOptions,
      eq(
        placementJobRoleOptions.id,
        placementApplications.roleOptionId,
      ),
    )
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        placementApplications.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      and(
        eq(placementApplications.jobId, job.id),
        eq(
          placementApplications.status,
          "SUBMITTED",
        ),
      ),
    )
    .orderBy(
      asc(placementApplicationScreenings.status),
      desc(placementApplications.submittedAt),
    );
}

export async function getPlacementScreening(
  context: RequestContext,
  applicationIdInput: string,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const row =
    await loadScreeningDetails(applicationId);

  if (
    context.membership?.id ===
      row.application.membershipId &&
    hasMembershipRole(context, "LEARNER")
  ) {
    return learnerScreeningView(row);
  }

  await requirePlacementManageScope(
    context,
    row.job.collegeId,
  );
  return {
    ...row,
    screeningMode: PLACEMENT_SCREENING_PROVENANCE.mode,
    screeningVersion: PLACEMENT_SCREENING_PROVENANCE.version,
    screeningProvenance: PLACEMENT_SCREENING_PROVENANCE,
    legacyScreeningVersion: row.job.legacyScreeningVersion ?? 1,
    legacyStageSources: PLACEMENT_SCREENING_LEGACY_STAGE_SOURCES,
    automatedScreening: {
      status: "NOT_RUN" as const, overallScore: null, skillsScore: null,
      educationScore: null, screenedAt: null, failureReason: null,
    },
    history:
      await loadScreeningHistory(applicationId),
  };
}

function canTransition(
  from: ScreeningStatus,
  to: Exclude<ScreeningStatus, "PENDING">,
) {
  if (from === "PENDING") {
    return (
      to === "HOLD" ||
      to === "SHORTLISTED" ||
      to === "REJECTED"
    );
  }
  if (from === "HOLD") {
    return (
      to === "SHORTLISTED" ||
      to === "REJECTED"
    );
  }
  return false;
}

export async function decidePlacementScreening(
  context: RequestContext,
  applicationIdInput: string,
  rawInput: PlacementScreeningDecisionInput,
  expectedUpdatedAt?: string,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const input =
    placementScreeningDecisionInputSchema.parse(
      rawInput,
    );
  const current =
    await loadScreeningDetails(applicationId);
  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  if (
    current.job.status === "CLOSED" ||
    current.job.status === "ARCHIVED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_JOB_READ_ONLY",
    );
  }

  if (current.application.status !== "SUBMITTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_SCREENING_APPLICATION_INACTIVE",
    );
  }

  // The database limits this field to 500 even though the generic DTO
  // also serves other surfaces with a 1000-character limit.
  if ((input.candidateMessage?.length ?? 0) > 500)
    throw new Error("Candidate message must be at most 500 characters");
  const from =
    current.screening.status as ScreeningStatus;
  if (expectedUpdatedAt !== undefined &&
      current.screening.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new PlacementsServiceError("PLACEMENT_SCREENING_STALE");
  }
  if (from === input.decision) {
    return current.screening;
  }
  if (!canTransition(from, input.decision)) {
    throw new PlacementsServiceError(
      "PLACEMENT_SCREENING_INVALID_TRANSITION",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedApplication] = await tx
      .select({
        status: placementApplications.status,
      })
      .from(placementApplications)
      .where(
        eq(
          placementApplications.id,
          applicationId,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !lockedApplication ||
      lockedApplication.status !== "SUBMITTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_SCREENING_APPLICATION_INACTIVE",
      );
    }

    const now = new Date();
    const [updated] = await tx
      .update(placementApplicationScreenings)
      .set({
        status: input.decision,
        candidateMessage:
          input.candidateMessage ?? null,
        internalReason:
          input.internalReason ?? null,
        decidedByUserId: context.user.id,
        decidedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            placementApplicationScreenings.applicationId,
            applicationId,
          ),
          eq(
            placementApplicationScreenings.status,
            from,
          ),
          ...(expectedUpdatedAt !== undefined ? [
            sql`date_trunc('milliseconds', ${placementApplicationScreenings.updatedAt}) =
              ${expectedUpdatedAt}::timestamptz`,
          ] : []),
        ),
      )
      .returning();

    if (!updated) {
      if (expectedUpdatedAt !== undefined) {
        throw new PlacementsServiceError("PLACEMENT_SCREENING_STALE");
      }
      const [concurrent] = await tx
        .select()
        .from(placementApplicationScreenings)
        .where(
          eq(
            placementApplicationScreenings.applicationId,
            applicationId,
          ),
        )
        .limit(1);

      if (
        concurrent?.status === input.decision
      ) {
        return concurrent;
      }
      throw new PlacementsServiceError(
        "PLACEMENT_SCREENING_INVALID_TRANSITION",
      );
    }

    await tx
      .insert(
        placementApplicationScreeningHistory,
      )
      .values({
        applicationId,
        fromStatus: from,
        toStatus: input.decision,
        candidateMessage:
          input.candidateMessage ?? null,
        internalReason:
          input.internalReason ?? null,
        actorUserId: context.user.id,
      });

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_SCREENING_DECIDED,
        collegeId: current.job.collegeId,
        subjectType:
          "placement_application",
        subjectId: applicationId,
        subjectLabel:
          current.candidate.displayName,
        summary:
          `Screening set to ${input.decision} for ${current.roleOption.title}`,
        metadata: {
          jobId: current.job.id,
          roleOptionId:
            current.roleOption.id,
          fromStatus: from,
          toStatus: input.decision,
          membershipId:
            current.candidate.membershipId,
          legacyDisposition: input.decision === "HOLD" ? "UNDER_REVIEW" : input.decision,
          rejectionReason: input.decision === "REJECTED"
            ? input.internalReason ?? input.candidateMessage ?? null : null,
          assessmentUrl: current.job.legacyPostingDetails?.assessmentUrl ?? null,
          candidateNotificationPolicy: input.decision === "HOLD"
            ? "INTERNAL_ONLY" : "VISIBLE_ON_APPLICANT_STATUS",
          automatedScore: null,
          screeningVersion: PLACEMENT_SCREENING_PROVENANCE.version,
        },
        groupKey:
          `placement-job:${current.job.id}:screening`,
        dedupeKey:
          `placement-screening:${applicationId}:${from.toLowerCase()}-${input.decision.toLowerCase()}`,
      },
    );

    return { ...updated,
      successMessage: "Application status updated successfully",
      automatedScreeningStatus: "NOT_RUN" as const,
    };
  });
}

/** Repair an old submitted application with no screening row. This explicit
 * manager-only action never marks screening complete and never manufactures
 * a score: it restores the missing PENDING human-review queue record. */
export async function ensurePlacementScreeningPending(
  context: RequestContext,
  applicationIdInput: string,
) {
  const applicationId = placementApplicationIdSchema.parse(applicationIdInput);
  const [application] = await getDb().select({
    id: placementApplications.id,
    status: placementApplications.status,
    collegeId: placementJobs.collegeId,
  }).from(placementApplications)
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(eq(placementApplications.id, applicationId)).limit(1);
  if (!application) throw new PlacementsServiceError("PLACEMENT_SCREENING_NOT_FOUND");
  await requirePlacementManageScope(context, application.collegeId);
  if (application.status !== "SUBMITTED")
    throw new PlacementsServiceError("PLACEMENT_SCREENING_APPLICATION_INACTIVE");
  await getDb().insert(placementApplicationScreenings)
    .values({applicationId, status: "PENDING"})
    .onConflictDoNothing({target: placementApplicationScreenings.applicationId});
  return loadScreeningDetails(applicationId);
}
