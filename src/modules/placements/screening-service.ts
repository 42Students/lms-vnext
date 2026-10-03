import {
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationScreeningHistory,
  placementApplicationScreenings,
  placementJobs,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
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

async function loadScreeningDetails(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      screening: placementApplicationScreenings,
      application: placementApplications,
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

  if (current.application.status !== "SUBMITTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_SCREENING_APPLICATION_INACTIVE",
    );
  }

  const from =
    current.screening.status as ScreeningStatus;
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
        ),
      )
      .returning();

    if (!updated) {
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

    return updated;
  });
}
