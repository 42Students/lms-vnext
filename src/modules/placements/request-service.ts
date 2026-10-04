import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { deliverInAppNotificationInTransaction } from "@/modules/activity/notification-service";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationStatusHistory,
  placementJobRounds,
  placementJobs,
  placementLearnerRequests,
  placementOffers,
  placementRoundResults,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import {
  requirePlacementManageScope,
} from "./scope";
import {
  createPlacementLearnerRequestInputSchema,
  placementLearnerRequestActionSchema,
  placementLearnerRequestIdSchema,
  type CreatePlacementLearnerRequestInput,
  type PlacementLearnerRequestActionInput,
} from "./validation";

type RequestPayload = {
  requestedScheduledAt?: string;
  timezone?: string;
  requestedExpiresAt?: string;
  correctionField?: string;
  requestedValue?: string;
};

function isUniqueViolation(
  error: unknown,
) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown })
        .code === "23505",
  );
}

function requireLearnerOwner(
  context: RequestContext,
  membershipId: string,
) {
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "LEARNER",
    ) ||
    context.membership.id !==
      membershipId
  ) {
    throw new AuthorizationError(
      "placements.read",
    );
  }
}

function requestPayload(
  input: ReturnType<
    typeof createPlacementLearnerRequestInputSchema.parse
  >,
): RequestPayload {
  switch (input.requestType) {
    case "ROUND_RESCHEDULE":
      return {
        requestedScheduledAt:
          input.requestedScheduledAt!
            .toISOString(),
        timezone: input.timezone!,
      };
    case "OFFER_EXTENSION":
      return {
        requestedExpiresAt:
          input.requestedExpiresAt!
            .toISOString(),
      };
    case "CORRECTION":
      return {
        correctionField:
          input.correctionField!,
        requestedValue:
          input.requestedValue!,
      };
    default:
      return {};
  }
}

function samePayload(
  first: unknown,
  second: RequestPayload,
) {
  return (
    JSON.stringify(first ?? {}) ===
    JSON.stringify(second)
  );
}

async function loadApplicationContext(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application:
        placementApplications,
      job: placementJobs,
      learnerUserId:
        collegeMemberships.userId,
    })
    .from(placementApplications)
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
    .where(
      eq(
        placementApplications.id,
        applicationId,
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_APPLICATION_NOT_FOUND",
    );
  }

  return row;
}

async function loadRequestContext(
  requestId: string,
) {
  const [row] = await getDb()
    .select({
      request:
        placementLearnerRequests,
      application:
        placementApplications,
      job: placementJobs,
      learnerUserId:
        collegeMemberships.userId,
      learnerName:
        users.displayName,
    })
    .from(placementLearnerRequests)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementLearnerRequests.applicationId,
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
        placementLearnerRequests.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .where(
      eq(
        placementLearnerRequests.id,
        requestId,
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_NOT_FOUND",
    );
  }

  return row;
}

async function validateRequestTarget(
  input: ReturnType<
    typeof createPlacementLearnerRequestInputSchema.parse
  >,
  application: Awaited<
    ReturnType<
      typeof loadApplicationContext
    >
  >,
  now: Date,
) {
  if (
    application.application.status !==
    "SUBMITTED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_INVALID_TARGET",
    );
  }

  if (
    input.requestType ===
    "APPLICATION_WITHDRAWAL"
  ) {
    return;
  }

  if (
    input.requestType ===
    "OFFER_EXTENSION"
  ) {
    const [offer] = await getDb()
      .select()
      .from(placementOffers)
      .where(
        eq(
          placementOffers.id,
          input.offerId!,
        ),
      )
      .limit(1);

    if (
      !offer ||
      offer.applicationId !==
        application.application.id ||
      offer.status !== "ISSUED" ||
      !offer.expiresAt ||
      !input.requestedExpiresAt ||
      input.requestedExpiresAt <=
        offer.expiresAt ||
      input.requestedExpiresAt <= now
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_INVALID_TARGET",
      );
    }
    return;
  }

  if (
    input.requestType ===
      "ROUND_RESCHEDULE" ||
    input.requestType ===
      "ABSENCE_DISPUTE"
  ) {
    const [round] = await getDb()
      .select()
      .from(placementJobRounds)
      .where(
        eq(
          placementJobRounds.id,
          input.roundId!,
        ),
      )
      .limit(1);

    if (
      !round ||
      round.jobId !==
        application.job.id
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_INVALID_TARGET",
      );
    }

    if (
      input.requestType ===
        "ROUND_RESCHEDULE" &&
      round.status !== "SCHEDULED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_INVALID_TARGET",
      );
    }

    if (
      input.requestType ===
      "ABSENCE_DISPUTE"
    ) {
      const [absent] = await getDb()
        .select({
          id: placementRoundResults.id,
        })
        .from(placementRoundResults)
        .where(
          and(
            eq(
              placementRoundResults.roundId,
              round.id,
            ),
            eq(
              placementRoundResults.applicationId,
              application.application.id,
            ),
            eq(
              placementRoundResults.status,
              "APPLIED",
            ),
            eq(
              placementRoundResults.outcome,
              "ABSENT",
            ),
          ),
        )
        .limit(1);

      if (!absent) {
        throw new PlacementsServiceError(
          "PLACEMENT_REQUEST_INVALID_TARGET",
        );
      }
    }
  }
}

export async function createPlacementLearnerRequest(
  context: RequestContext,
  rawInput:
    CreatePlacementLearnerRequestInput,
  now = new Date(),
) {
  const input =
    createPlacementLearnerRequestInputSchema.parse(
      rawInput,
    );
  const application =
    await loadApplicationContext(
      input.applicationId,
    );

  requireLearnerOwner(
    context,
    application.application
      .membershipId,
  );

  await validateRequestTarget(
    input,
    application,
    now,
  );

  const payload = requestPayload(input);
  const db = getDb();

  const [existing] = await db
    .select()
    .from(placementLearnerRequests)
    .where(
      and(
        eq(
          placementLearnerRequests.applicationId,
          application.application.id,
        ),
        eq(
          placementLearnerRequests.requestType,
          input.requestType,
        ),
        eq(
          placementLearnerRequests.status,
          "PENDING",
        ),
      ),
    )
    .limit(1);

  if (existing) {
    if (
      existing.membershipId ===
        application.application
          .membershipId &&
      existing.roundId ===
        (input.roundId ?? null) &&
      existing.offerId ===
        (input.offerId ?? null) &&
      existing.reason ===
        input.reason &&
      samePayload(
        existing.requestedPayload,
        payload,
      )
    ) {
      return existing;
    }

    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_ACTIVE_EXISTS",
    );
  }

  try {
    return await db.transaction(
      async (tx) => {
        const [created] = await tx
          .insert(
            placementLearnerRequests,
          )
          .values({
            applicationId:
              application.application.id,
            membershipId:
              application.application
                .membershipId,
            roundId:
              input.roundId ?? null,
            offerId:
              input.offerId ?? null,
            requestType:
              input.requestType,
            reason: input.reason,
            requestedPayload: payload,
            requestedByUserId:
              context.user.id,
          })
          .returning();

        await recordActivityEventInTransaction(
          tx,
          context,
          {
            eventType:
              ACTIVITY_EVENT_TYPES.PLACEMENTS_REQUEST_CREATED,
            collegeId:
              application.job.collegeId,
            subjectType:
              "placement_request",
            subjectId: created.id,
            subjectLabel:
              application.job.title,
            summary:
              `${input.requestType
                .toLowerCase()
                .replaceAll("_", " ")} request submitted for ${application.job.title}`,
            metadata: {
              applicationId:
                application.application.id,
              requestType:
                input.requestType,
              roundId:
                input.roundId ?? null,
              offerId:
                input.offerId ?? null,
            },
            groupKey:
              `placement-application:${application.application.id}:requests`,
            dedupeKey:
              `placement-request:${created.id}:created`,
          },
        );

        return created;
      },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_ACTIVE_EXISTS",
      );
    }
    throw error;
  }
}

export async function listOwnPlacementLearnerRequests(
  context: RequestContext,
) {
  if (
    !context.membership ||
    !hasMembershipRole(
      context,
      "LEARNER",
    )
  ) {
    throw new AuthorizationError(
      "placements.read",
    );
  }

  return getDb()
    .select({
      request:
        placementLearnerRequests,
      job: {
        id: placementJobs.id,
        title: placementJobs.title,
      },
    })
    .from(placementLearnerRequests)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementLearnerRequests.applicationId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .where(
      eq(
        placementLearnerRequests.membershipId,
        context.membership.id,
      ),
    )
    .orderBy(
      desc(
        placementLearnerRequests.createdAt,
      ),
    );
}

export async function listPlacementLearnerRequests(
  context: RequestContext,
  collegeId: string,
) {
  await requirePlacementManageScope(
    context,
    collegeId,
  );

  return getDb()
    .select({
      request:
        placementLearnerRequests,
      job: {
        id: placementJobs.id,
        title: placementJobs.title,
      },
      learner: {
        userId: users.id,
        displayName:
          users.displayName,
        email: users.email,
      },
    })
    .from(placementLearnerRequests)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementLearnerRequests.applicationId,
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
        placementLearnerRequests.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .where(
      eq(
        placementJobs.collegeId,
        collegeId,
      ),
    )
    .orderBy(
      desc(
        placementLearnerRequests.createdAt,
      ),
    );
}

function payloadObject(
  raw: unknown,
): RequestPayload {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw)
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }
  return raw as RequestPayload;
}

type ActivityTransaction = Parameters<
  typeof recordActivityEventInTransaction
>[0];

async function recordResolution(
  tx: ActivityTransaction,
  context: RequestContext,
  current: Awaited<
    ReturnType<
      typeof loadRequestContext
    >
  >,
  status:
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED",
) {
  return recordActivityEventInTransaction(
    tx,
    context,
    {
      eventType:
        ACTIVITY_EVENT_TYPES.PLACEMENTS_REQUEST_RESOLVED,
      collegeId:
        current.job.collegeId,
      subjectType:
        "placement_request",
      subjectId:
        current.request.id,
      subjectLabel:
        current.job.title,
      summary:
        `Placement request ${status.toLowerCase()} for ${current.job.title}`,
      metadata: {
        applicationId:
          current.application.id,
        requestType:
          current.request.requestType,
        status,
      },
      groupKey:
        `placement-application:${current.application.id}:requests`,
      dedupeKey:
        `placement-request:${current.request.id}:${status.toLowerCase()}`,
    },
  );
}

export async function actOnPlacementLearnerRequest(
  context: RequestContext,
  requestIdInput: string,
  rawInput:
    PlacementLearnerRequestActionInput,
  now = new Date(),
) {
  const requestId =
    placementLearnerRequestIdSchema.parse(
      requestIdInput,
    );
  const input =
    placementLearnerRequestActionSchema.parse(
      rawInput,
    );
  const current =
    await loadRequestContext(requestId);

  if (input.action === "CANCEL") {
    requireLearnerOwner(
      context,
      current.request.membershipId,
    );

    if (
      current.request.status ===
      "CANCELLED"
    ) {
      return current.request;
    }
    if (
      current.request.status !==
      "PENDING"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_INVALID_TRANSITION",
      );
    }

    return getDb().transaction(
      async (tx) => {
        const [locked] = await tx
          .select()
          .from(
            placementLearnerRequests,
          )
          .where(
            eq(
              placementLearnerRequests.id,
              requestId,
            ),
          )
          .for("update")
          .limit(1);

        if (!locked) {
          throw new PlacementsServiceError(
            "PLACEMENT_REQUEST_NOT_FOUND",
          );
        }
        if (
          locked.status ===
          "CANCELLED"
        ) {
          return locked;
        }
        if (
          locked.status !==
          "PENDING"
        ) {
          throw new PlacementsServiceError(
            "PLACEMENT_REQUEST_INVALID_TRANSITION",
          );
        }

        const [updated] = await tx
          .update(
            placementLearnerRequests,
          )
          .set({
            status: "CANCELLED",
            cancelledAt: now,
            updatedAt: now,
          })
          .where(
            eq(
              placementLearnerRequests.id,
              requestId,
            ),
          )
          .returning();

        await recordResolution(
          tx,
          context,
          current,
          "CANCELLED",
        );
        return updated;
      },
    );
  }

  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  const targetStatus =
    input.action === "APPROVE"
      ? "APPROVED"
      : "REJECTED";

  if (
    current.request.status ===
    targetStatus
  ) {
    return current.request;
  }
  if (
    current.request.status !==
    "PENDING"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_INVALID_TRANSITION",
    );
  }

  return getDb().transaction(
    async (tx) => {
      const [locked] = await tx
        .select()
        .from(
          placementLearnerRequests,
        )
        .where(
          eq(
            placementLearnerRequests.id,
            requestId,
          ),
        )
        .for("update")
        .limit(1);

      if (!locked) {
        throw new PlacementsServiceError(
          "PLACEMENT_REQUEST_NOT_FOUND",
        );
      }
      if (
        locked.status ===
        targetStatus
      ) {
        return locked;
      }
      if (
        locked.status !==
        "PENDING"
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_REQUEST_INVALID_TRANSITION",
        );
      }

      if (input.action === "REJECT") {
        const [updated] = await tx
          .update(
            placementLearnerRequests,
          )
          .set({
            status: "REJECTED",
            decisionReason:
              input.reason,
            decidedByUserId:
              context.user.id,
            decidedAt: now,
            updatedAt: now,
          })
          .where(
            eq(
              placementLearnerRequests.id,
              requestId,
            ),
          )
          .returning();

        const event =
          await recordResolution(
            tx,
            context,
            current,
            "REJECTED",
          );
        await deliverInAppNotificationInTransaction(
          tx,
          event.id,
          [current.learnerUserId],
          {
            title:
              "Placement request rejected",
            body:
              `${current.job.title}: ${input.reason}`,
            actionHref:
              "/learn/placements",
          },
        );
        return updated;
      }

      const payload =
        payloadObject(
          locked.requestedPayload,
        );

      if (
        locked.requestType ===
        "APPLICATION_WITHDRAWAL"
      ) {
        const [application] =
          await tx
            .select()
            .from(
              placementApplications,
            )
            .where(
              eq(
                placementApplications.id,
                locked.applicationId,
              ),
            )
            .for("update")
            .limit(1);

        if (
          !application ||
          application.status !==
            "SUBMITTED"
        ) {
          throw new PlacementsServiceError(
            "PLACEMENT_REQUEST_EFFECT_INVALID",
          );
        }

        await tx
          .update(
            placementApplications,
          )
          .set({
            status: "WITHDRAWN",
            withdrawnAt: now,
            updatedAt: now,
          })
          .where(
            eq(
              placementApplications.id,
              application.id,
            ),
          );

        await tx
          .insert(
            placementApplicationStatusHistory,
          )
          .values({
            applicationId:
              application.id,
            fromStatus:
              "SUBMITTED",
            toStatus:
              "WITHDRAWN",
            actorUserId:
              context.user.id,
            reason:
              `Approved learner request ${locked.id}`,
          });

        await recordActivityEventInTransaction(
          tx,
          context,
          {
            eventType:
              ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_WITHDRAWN,
            collegeId:
              current.job.collegeId,
            subjectType:
              "placement_application",
            subjectId:
              application.id,
            subjectLabel:
              current.job.title,
            summary:
              `Application withdrawn from ${current.job.title}`,
            metadata: {
              jobId:
                current.job.id,
              membershipId:
                locked.membershipId,
              requestId:
                locked.id,
            },
            groupKey:
              `placement-job:${current.job.id}:applications`,
            dedupeKey:
              `placement-application:${application.id}:withdrawn`,
          },
        );
      } else if (
        locked.requestType ===
        "OFFER_EXTENSION"
      ) {
        const requested =
          payload.requestedExpiresAt
            ? new Date(
                payload.requestedExpiresAt,
              )
            : null;

        if (
          !requested ||
          Number.isNaN(
            requested.getTime(),
          )
        ) {
          throw new PlacementsServiceError(
            "PLACEMENT_REQUEST_EFFECT_INVALID",
          );
        }

        const [offer] = await tx
          .select()
          .from(placementOffers)
          .where(
            eq(
              placementOffers.id,
              locked.offerId!,
            ),
          )
          .for("update")
          .limit(1);

        if (
          !offer ||
          offer.applicationId !==
            locked.applicationId ||
          offer.status !== "ISSUED" ||
          !offer.expiresAt ||
          requested <=
            offer.expiresAt ||
          requested <= now
        ) {
          throw new PlacementsServiceError(
            "PLACEMENT_REQUEST_EFFECT_INVALID",
          );
        }

        await tx
          .update(placementOffers)
          .set({
            expiresAt: requested,
            updatedAt: now,
          })
          .where(
            eq(
              placementOffers.id,
              offer.id,
            ),
          );

        await recordActivityEventInTransaction(
          tx,
          context,
          {
            eventType:
              ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_EXTENDED,
            collegeId:
              current.job.collegeId,
            subjectType:
              "placement_offer",
            subjectId: offer.id,
            subjectLabel:
              current.job.title,
            summary:
              `Offer response deadline extended for ${current.job.title}`,
            metadata: {
              applicationId:
                locked.applicationId,
              requestId:
                locked.id,
              expiresAt:
                requested.toISOString(),
            },
            groupKey:
              `placement-application:${locked.applicationId}:offer`,
            dedupeKey:
              `placement-request:${locked.id}:offer-extended`,
          },
        );
      } else {
        throw new PlacementsServiceError(
          "PLACEMENT_REQUEST_EFFECT_UNSUPPORTED",
        );
      }

      const [updated] = await tx
        .update(
          placementLearnerRequests,
        )
        .set({
          status: "APPROVED",
          decisionReason:
            input.reason ?? null,
          decidedByUserId:
            context.user.id,
          decidedAt: now,
          effectAppliedAt: now,
          updatedAt: now,
        })
        .where(
          eq(
            placementLearnerRequests.id,
            requestId,
          ),
        )
        .returning();

      const event =
        await recordResolution(
          tx,
          context,
          current,
          "APPROVED",
        );
      await deliverInAppNotificationInTransaction(
        tx,
        event.id,
        [current.learnerUserId],
        {
          title:
            "Placement request approved",
          body:
            `${current.job.title}: your ${locked.requestType
              .toLowerCase()
              .replaceAll("_", " ")} request was approved.`,
          actionHref:
            "/learn/placements",
        },
      );

      return updated;
    },
  );
}
