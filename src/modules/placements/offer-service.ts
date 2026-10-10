import {
  and,
  asc,
  desc,
  eq,
  inArray,
  max,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { deliverInAppNotificationInTransaction } from "@/modules/activity/notification-service";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  placementApplications,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementJoiningHistory,
  placementJoiningOutcomes,
  placementJobRounds,
  placementJobRoleOptions,
  placementJobs,
  placementOffers,
  placementOfferStatusHistory,
  placementRoundResults,
  users,
} from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { requirePlacementManageScope } from "./scope";
import {
  issuePlacementOfferInputSchema,
  placementApplicationIdSchema,
  placementJoiningOutcomeInputSchema,
  placementOfferActionSchema,
  placementOfferIdSchema,
  placementJobIdSchema,
  type IssuePlacementOfferInput,
  type PlacementJoiningOutcomeInput,
  type PlacementOfferActionInput,
} from "./validation";

async function loadApplicationContext(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application: placementApplications,
      screening: placementApplicationScreenings,
      job: placementJobs,
    })
    .from(placementApplications)
    .innerJoin(
      placementApplicationScreenings,
      eq(
        placementApplicationScreenings.applicationId,
        placementApplications.id,
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

async function loadOfferContext(
  offerId: string,
) {
  const [row] = await getDb()
    .select({
      offer: placementOffers,
      application: placementApplications,
      job: placementJobs,
    })
    .from(placementOffers)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementOffers.applicationId,
      ),
    )
    .innerJoin(
      placementJobs,
      eq(
        placementJobs.id,
        placementApplications.jobId,
      ),
    )
    .where(eq(placementOffers.id, offerId))
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_FOUND",
    );
  }

  return row;
}

function requireLearnerOfferOwner(
  context: RequestContext,
  membershipId: string,
) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER") ||
    context.membership.id !== membershipId
  ) {
    throw new AuthorizationError("placements.read");
  }
}

async function assertApplicationOfferReady(
  applicationId: string,
  jobId: string,
) {
  const rounds = await getDb()
    .select({
      id: placementJobRounds.id,
      status: placementJobRounds.status,
      sequence: placementJobRounds.sequence,
    })
    .from(placementJobRounds)
    .where(
      and(
        eq(placementJobRounds.jobId, jobId),
        ne(placementJobRounds.kind, "TALK"),
        ne(
          placementJobRounds.status,
          "CANCELLED",
        ),
      ),
    )
    .orderBy(asc(placementJobRounds.sequence));

  if (
    rounds.length === 0 ||
    rounds.some(
      (round) =>
        round.status !== "COMPLETED",
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_READY",
    );
  }

  const results = await getDb()
    .select({
      roundId: placementRoundResults.roundId,
      outcome: placementRoundResults.outcome,
    })
    .from(placementRoundResults)
    .where(
      and(
        eq(
          placementRoundResults.applicationId,
          applicationId,
        ),
        eq(
          placementRoundResults.status,
          "APPLIED",
        ),
        inArray(
          placementRoundResults.roundId,
          rounds.map((round) => round.id),
        ),
      ),
    );

  const passed = new Set(
    results
      .filter(
        (result) =>
          result.outcome === "PASS",
      )
      .map((result) => result.roundId),
  );

  if (
    rounds.some(
      (round) => !passed.has(round.id),
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_READY",
    );
  }
}

function sameOfferPayload(
  offer: typeof placementOffers.$inferSelect,
  input: ReturnType<
    typeof issuePlacementOfferInputSchema.parse
  >,
) {
  return (
    offer.roleTitle === input.roleTitle &&
    offer.annualCtcInr ===
      (input.annualCtcInr ?? null) &&
    offer.joiningDate ===
      (input.joiningDate ?? null) &&
    (offer.expiresAt?.getTime() ?? null) ===
      (input.expiresAt?.getTime() ?? null)
  );
}

export async function issuePlacementOffer(
  context: RequestContext,
  applicationIdInput: string,
  rawInput: IssuePlacementOfferInput,
) {
  const applicationId =
    placementApplicationIdSchema.parse(
      applicationIdInput,
    );
  const input =
    issuePlacementOfferInputSchema.parse(
      rawInput,
    );
  const current =
    await loadApplicationContext(applicationId);

  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  if (
    current.application.status !==
      "SUBMITTED" ||
    current.screening.status !==
      "SHORTLISTED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_NOT_READY",
    );
  }

  const now = new Date();
  if (
    input.expiresAt &&
    input.expiresAt.getTime() <=
      now.getTime()
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_EXPIRED",
    );
  }

  await assertApplicationOfferReady(
    current.application.id,
    current.job.id,
  );

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedApplication] =
      await tx
        .select({
          status:
            placementApplications.status,
        })
        .from(placementApplications)
        .where(
          eq(
            placementApplications.id,
            current.application.id,
          ),
        )
        .for("update")
        .limit(1);

    if (
      !lockedApplication ||
      lockedApplication.status !==
        "SUBMITTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_NOT_READY",
      );
    }

    const [active] = await tx
      .select()
      .from(placementOffers)
      .where(
        and(
          eq(
            placementOffers.applicationId,
            current.application.id,
          ),
          inArray(
            placementOffers.status,
            ["ISSUED", "ACCEPTED"],
          ),
        ),
      )
      .limit(1);

    if (active) {
      if (
        active.status === "ISSUED" &&
        sameOfferPayload(active, input)
      ) {
        return active;
      }
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_ACTIVE_EXISTS",
      );
    }

    const [aggregate] = await tx
      .select({
        maxVersion: max(
          placementOffers.version,
        ),
      })
      .from(placementOffers)
      .where(
        eq(
          placementOffers.applicationId,
          current.application.id,
        ),
      );

    const [offer] = await tx
      .insert(placementOffers)
      .values({
        applicationId:
          current.application.id,
        version:
          Number(
            aggregate?.maxVersion ?? 0,
          ) + 1,
        roleTitle: input.roleTitle,
        annualCtcInr:
          input.annualCtcInr ?? null,
        joiningDate:
          input.joiningDate ?? null,
        expiresAt:
          input.expiresAt ?? null,
        issuedByUserId:
          context.user.id,
        issuedAt: now,
      })
      .returning();

    await tx
      .insert(
        placementOfferStatusHistory,
      )
      .values({
        offerId: offer.id,
        fromStatus: null,
        toStatus: "ISSUED",
        actorUserId: context.user.id,
      });

    const [recipient] = await tx
      .select({
        userId: collegeMemberships.userId,
      })
      .from(collegeMemberships)
      .where(
        and(
          eq(
            collegeMemberships.id,
            current.application.membershipId,
          ),
          eq(
            collegeMemberships.collegeId,
            current.job.collegeId,
          ),
        ),
      )
      .limit(1);

    if (!recipient) {
      throw new PlacementsServiceError(
        "PLACEMENT_APPLICATION_NOT_FOUND",
      );
    }

    const event =
      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_ISSUED,
          collegeId: current.job.collegeId,
          subjectType: "placement_offer",
          subjectId: offer.id,
          subjectLabel: input.roleTitle,
          summary:
            `Offer issued for ${current.job.title}`,
          metadata: {
            jobId: current.job.id,
            applicationId:
              current.application.id,
            membershipId:
              current.application.membershipId,
            roleTitle: input.roleTitle,
            version: offer.version,
          },
          groupKey:
            `placement-job:${current.job.id}:offers`,
          dedupeKey:
            `placement-offer:${offer.id}:issued`,
        },
      );

    await deliverInAppNotificationInTransaction(
      tx,
      event.id,
      [recipient.userId],
      {
        title: "Placement offer received",
        body:
          `You received a ${input.roleTitle} offer for ${current.job.title}. Review and respond to it.`,
        actionHref: "/learn/placements",
      },
    );

    return offer;
  });
}

export async function actOnPlacementOffer(
  context: RequestContext,
  offerIdInput: string,
  rawInput: PlacementOfferActionInput,
  now: Date = new Date(),
) {
  const offerId =
    placementOfferIdSchema.parse(
      offerIdInput,
    );
  const input =
    placementOfferActionSchema.parse(
      rawInput,
    );
  const current =
    await loadOfferContext(offerId);

  if (
    input.action === "ACCEPT" ||
    input.action === "DECLINE"
  ) {
    requireLearnerOfferOwner(
      context,
      current.application.membershipId,
    );
    // Self acceptance/decline is not a back door around paid module or the
    // learner/class/batch placement decision. TPO withdrawal is separate.
    await requireLearnerPlacementAccess(context);
  } else {
    await requirePlacementManageScope(
      context,
      current.job.collegeId,
    );
  }

  if (
    input.action !== "WITHDRAW" &&
    current.offer.expiresAt &&
    now.getTime() >
      current.offer.expiresAt.getTime()
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OFFER_EXPIRED",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [offer] = await tx
      .select()
      .from(placementOffers)
      .where(
        eq(placementOffers.id, offerId),
      )
      .for("update")
      .limit(1);

    if (!offer) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_NOT_FOUND",
      );
    }

    if (
      input.action !== "WITHDRAW" &&
      offer.expiresAt &&
      now.getTime() >
        offer.expiresAt.getTime()
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_EXPIRED",
      );
    }

    if (input.action === "ACCEPT") {
      if (offer.status === "ACCEPTED") {
        return offer;
      }
      if (offer.status !== "ISSUED") {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      const [updated] = await tx
        .update(placementOffers)
        .set({
          status: "ACCEPTED",
          respondedByUserId:
            context.user.id,
          respondedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(
              placementOffers.id,
              offer.id,
            ),
            eq(
              placementOffers.status,
              "ISSUED",
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      await tx
        .insert(
          placementOfferStatusHistory,
        )
        .values({
          offerId: offer.id,
          fromStatus: "ISSUED",
          toStatus: "ACCEPTED",
          actorUserId:
            context.user.id,
        });

      await tx
        .insert(
          placementJoiningOutcomes,
        )
        .values({
          offerId: offer.id,
        })
        .onConflictDoNothing();

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
          collegeId: current.job.collegeId,
          subjectType: "placement_offer",
          subjectId: updated.id,
          subjectLabel: updated.roleTitle,
          summary:
            `Offer accepted for ${current.job.title}`,
          metadata: {
            jobId: current.job.id,
            applicationId:
              current.application.id,
            response: "ACCEPTED",
          },
          groupKey:
            `placement-job:${current.job.id}:offers`,
          dedupeKey:
            `placement-offer:${updated.id}:accepted`,
        },
      );

      return updated;
    }

    if (input.action === "DECLINE") {
      if (offer.status === "DECLINED") {
        return offer;
      }
      if (offer.status !== "ISSUED") {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      const [updated] = await tx
        .update(placementOffers)
        .set({
          status: "DECLINED",
          respondedByUserId:
            context.user.id,
          respondedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(
              placementOffers.id,
              offer.id,
            ),
            eq(
              placementOffers.status,
              "ISSUED",
            ),
          ),
        )
        .returning();

      if (!updated) {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }

      await tx
        .insert(
          placementOfferStatusHistory,
        )
        .values({
          offerId: offer.id,
          fromStatus: "ISSUED",
          toStatus: "DECLINED",
          actorUserId:
            context.user.id,
          reason:
            input.reason ?? null,
        });

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
          collegeId: current.job.collegeId,
          subjectType: "placement_offer",
          subjectId: updated.id,
          subjectLabel: updated.roleTitle,
          summary:
            `Offer declined for ${current.job.title}`,
          metadata: {
            jobId: current.job.id,
            applicationId:
              current.application.id,
            response: "DECLINED",
          },
          groupKey:
            `placement-job:${current.job.id}:offers`,
          dedupeKey:
            `placement-offer:${updated.id}:declined`,
        },
      );

      return updated;
    }

    if (offer.status === "WITHDRAWN") {
      return offer;
    }
    if (
      offer.status !== "ISSUED" &&
      offer.status !== "ACCEPTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_OFFER_INVALID_TRANSITION",
      );
    }

    if (offer.status === "ACCEPTED") {
      const [joining] = await tx
        .select()
        .from(placementJoiningOutcomes)
        .where(
          eq(
            placementJoiningOutcomes.offerId,
            offer.id,
          ),
        )
        .for("update")
        .limit(1);

      if (
        joining &&
        joining.status !== "PENDING"
      ) {
        throw new PlacementsServiceError(
          "PLACEMENT_OFFER_INVALID_TRANSITION",
        );
      }
    }

    const [updated] = await tx
      .update(placementOffers)
      .set({
        status: "WITHDRAWN",
        withdrawnByUserId:
          context.user.id,
        withdrawnAt: now,
        updatedAt: now,
      })
      .where(
        eq(
          placementOffers.id,
          offer.id,
        ),
      )
      .returning();

    await tx
      .insert(
        placementOfferStatusHistory,
      )
      .values({
        offerId: offer.id,
        fromStatus: offer.status,
        toStatus: "WITHDRAWN",
        actorUserId:
          context.user.id,
        reason: input.reason,
      });

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
        collegeId: current.job.collegeId,
        subjectType: "placement_offer",
        subjectId: updated.id,
        subjectLabel: updated.roleTitle,
        summary:
          `Offer withdrawn for ${current.job.title}`,
        metadata: {
          jobId: current.job.id,
          applicationId:
            current.application.id,
          response: "WITHDRAWN",
        },
        groupKey:
          `placement-job:${current.job.id}:offers`,
        dedupeKey:
          `placement-offer:${updated.id}:withdrawn`,
      },
    );

    return updated;
  });
}

export async function recordPlacementJoiningOutcome(
  context: RequestContext,
  offerIdInput: string,
  rawInput: PlacementJoiningOutcomeInput,
) {
  const offerId =
    placementOfferIdSchema.parse(
      offerIdInput,
    );
  const input =
    placementJoiningOutcomeInputSchema.parse(
      rawInput,
    );
  const current =
    await loadOfferContext(offerId);

  await requirePlacementManageScope(
    context,
    current.job.collegeId,
  );

  if (current.offer.status !== "ACCEPTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_JOINING_NOT_READY",
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedOffer] = await tx
      .select({
        status: placementOffers.status,
      })
      .from(placementOffers)
      .where(
        eq(
          placementOffers.id,
          offerId,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !lockedOffer ||
      lockedOffer.status !== "ACCEPTED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOINING_NOT_READY",
      );
    }

    await tx
      .insert(placementJoiningOutcomes)
      .values({ offerId })
      .onConflictDoNothing();

    const [joining] = await tx
      .select()
      .from(placementJoiningOutcomes)
      .where(
        eq(
          placementJoiningOutcomes.offerId,
          offerId,
        ),
      )
      .for("update")
      .limit(1);

    if (!joining) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOINING_NOT_READY",
      );
    }

    const nextJoiningDate =
      input.joiningDate ?? null;
    const nextReason =
      input.reason ?? null;

    if (
      joining.status === input.status &&
      joining.joiningDate ===
        nextJoiningDate &&
      joining.reason === nextReason
    ) {
      return joining;
    }

    if (
      joining.status !== "PENDING" &&
      !input.correctionReason
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_JOINING_CORRECTION_REASON_REQUIRED",
      );
    }

    const now = new Date();
    const [updated] = await tx
      .update(placementJoiningOutcomes)
      .set({
        status: input.status,
        joiningDate:
          nextJoiningDate,
        reason: nextReason,
        recordedByUserId:
          context.user.id,
        recordedAt: now,
        updatedAt: now,
      })
      .where(
        eq(
          placementJoiningOutcomes.offerId,
          offerId,
        ),
      )
      .returning();

    await tx
      .insert(
        placementJoiningHistory,
      )
      .values({
        offerId,
        fromStatus: joining.status,
        toStatus: input.status,
        joiningDate:
          nextJoiningDate,
        reason:
          input.correctionReason ??
          nextReason,
        actorUserId:
          context.user.id,
      });

    await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_JOINING_RECORDED,
        collegeId: current.job.collegeId,
        subjectType:
          "placement_joining",
        subjectId: offerId,
        subjectLabel:
          current.offer.roleTitle,
        summary:
          `Joining outcome set to ${input.status} for ${current.job.title}`,
        metadata: {
          jobId: current.job.id,
          applicationId:
            current.application.id,
          offerId,
          fromStatus: joining.status,
          toStatus: input.status,
          joiningDate:
            nextJoiningDate,
        },
        groupKey:
          `placement-job:${current.job.id}:joining`,
      },
    );

    return updated;
  });
}

export async function listOwnPlacementOffers(
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
  await requireLearnerPlacementAccess(context);

  return getDb()
    .select({
      offer: placementOffers,
      joining: placementJoiningOutcomes,
      job: {
        id: placementJobs.id,
        title: placementJobs.title,
      },
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
      },
    })
    .from(placementOffers)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementOffers.applicationId,
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
      placementCompanyRelationships,
      eq(
        placementCompanyRelationships.id,
        placementJobs.companyRelationshipId,
      ),
    )
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .leftJoin(
      placementJoiningOutcomes,
      eq(
        placementJoiningOutcomes.offerId,
        placementOffers.id,
      ),
    )
    .where(
      eq(
        placementApplications.membershipId,
        context.membership.id,
      ),
    )
    .orderBy(
      desc(placementOffers.issuedAt),
    );
}

export async function listPlacementJobOffers(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(
      jobIdInput,
    );
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
      offer: placementOffers,
      joining: placementJoiningOutcomes,
      candidate: {
        membershipId:
          collegeMemberships.id,
        displayName: users.displayName,
        email: users.email,
      },
    })
    .from(placementOffers)
    .innerJoin(
      placementApplications,
      eq(
        placementApplications.id,
        placementOffers.applicationId,
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
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .leftJoin(
      placementJoiningOutcomes,
      eq(
        placementJoiningOutcomes.offerId,
        placementOffers.id,
      ),
    )
    .where(
      and(
        eq(
          placementApplications.jobId,
          job.id,
        ),
        eq(
          collegeMemberships.collegeId,
          job.collegeId,
        ),
      ),
    )
    .orderBy(
      asc(users.displayName),
      desc(placementOffers.issuedAt),
    );
}


export async function listPlacementOfferCandidates(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(
      jobIdInput,
    );
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

  const db = getDb();
  const [rounds, applications, results, offers] =
    await Promise.all([
      db
        .select({
          id: placementJobRounds.id,
          status: placementJobRounds.status,
        })
        .from(placementJobRounds)
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              job.id,
            ),
            ne(
              placementJobRounds.kind,
              "TALK",
            ),
            ne(
              placementJobRounds.status,
              "CANCELLED",
            ),
          ),
        ),
      db
        .select({
          applicationId:
            placementApplications.id,
          membershipId:
            collegeMemberships.id,
          roleOptionId:
            placementJobRoleOptions.id,
          roleTitle:
            placementJobRoleOptions.title,
          displayName: users.displayName,
          email: users.email,
        })
        .from(placementApplications)
        .innerJoin(
          placementApplicationScreenings,
          eq(
            placementApplicationScreenings.applicationId,
            placementApplications.id,
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
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .where(
          and(
            eq(
              placementApplications.jobId,
              job.id,
            ),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
            eq(
              placementApplicationScreenings.status,
              "SHORTLISTED",
            ),
            eq(
              collegeMemberships.collegeId,
              job.collegeId,
            ),
          ),
        )
        .orderBy(asc(users.displayName)),
      db
        .select({
          roundId:
            placementRoundResults.roundId,
          applicationId:
            placementRoundResults.applicationId,
          outcome:
            placementRoundResults.outcome,
        })
        .from(placementRoundResults)
        .innerJoin(
          placementJobRounds,
          eq(
            placementJobRounds.id,
            placementRoundResults.roundId,
          ),
        )
        .where(
          and(
            eq(
              placementJobRounds.jobId,
              job.id,
            ),
            eq(
              placementRoundResults.status,
              "APPLIED",
            ),
          ),
        ),
      db
        .select({
          offer: placementOffers,
          joining: placementJoiningOutcomes,
        })
        .from(placementOffers)
        .innerJoin(
          placementApplications,
          eq(
            placementApplications.id,
            placementOffers.applicationId,
          ),
        )
        .leftJoin(
          placementJoiningOutcomes,
          eq(
            placementJoiningOutcomes.offerId,
            placementOffers.id,
          ),
        )
        .where(
          eq(
            placementApplications.jobId,
            job.id,
          ),
        )
        .orderBy(
          desc(placementOffers.issuedAt),
        ),
    ]);

  const resultsByApplication = new Map<
    string,
    Set<string>
  >();
  for (const result of results) {
    if (result.outcome !== "PASS") {
      continue;
    }
    const passed =
      resultsByApplication.get(
        result.applicationId,
      ) ?? new Set<string>();
    passed.add(result.roundId);
    resultsByApplication.set(
      result.applicationId,
      passed,
    );
  }

  const latestOfferByApplication =
    new Map<
      string,
      {
        offer:
          typeof placementOffers.$inferSelect;
        joining:
          typeof placementJoiningOutcomes.$inferSelect | null;
      }
    >();
  for (const row of offers) {
    if (
      !latestOfferByApplication.has(
        row.offer.applicationId,
      )
    ) {
      latestOfferByApplication.set(
        row.offer.applicationId,
        row,
      );
    }
  }

  const roundsReady =
    rounds.length > 0 &&
    rounds.every(
      (round) =>
        round.status === "COMPLETED",
    );

  return applications.map(
    (application) => ({
      ...application,
      offerReady:
        roundsReady &&
        rounds.every((round) =>
          resultsByApplication
            .get(
              application.applicationId,
            )
            ?.has(round.id),
        ),
      offer:
        latestOfferByApplication.get(
          application.applicationId,
        )?.offer ?? null,
      joining:
        latestOfferByApplication.get(
          application.applicationId,
        )?.joining ?? null,
    }),
  );
}
