import {recordApplicationStatusTransition} from "./application-status-history-writer";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  or,
  lt,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {deliverRecordedLearnerPlacementEvent} from "./learner-placement-event-delivery";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  membershipRoles,
  placementApplicationRoundExceptions,
  placementApplications,
  placementApplicationScreenings,
  placementCompanies,
  placementCompanyRelationships,
  placementJobRoleOptions,
  placementJobRounds,
  placementJobs,
  placementLearnerRequests,
  inAppNotifications,
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
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { PlacementsServiceError } from "./errors";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {learnerPlacementRoundDeadlineAvailable} from "./learner-assessment-deadline-readiness";
import {learnerRoundConfirmationReady} from "./learner-round-confirmation-readiness";
import { requirePlacementManageScope } from "./scope";
import {
  createPlacementRequestInputSchema,
  placementJobIdSchema,
  placementRequestActionSchema,
  placementRequestIdSchema,
  type CreatePlacementRequestInput,
  type PlacementRequestActionInput,
} from "./validation";

type PlacementRequestTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

type PlacementRequestWriter = Pick<
  ReturnType<typeof getDb>,
  "select" | "insert" | "update"
>;

type RescheduleEffect = {
  scheduledAt: string;
  timezone: string;
  mode: "ON_CAMPUS" | "VIRTUAL";
  venue: string | null;
  meetingUrl: string | null;
  // Informational only; never treated as a confirmed meeting time.
  preferredTimes?: string | null;
};

type OfferExtensionEffect = {
  requestedExpiresAt: string;
};

/** Read-only projection for historic free-text reschedule requests.
 * Do not turn preferredTimes into an approved booking or execute an old reply.
 * Modern requests still require the structured, validated RescheduleEffect.
 */
export function legacyRescheduleRequestDisplay(
  payload:unknown,
  status:string,
  decisionNote:string|null,
) {
  const fields = payload && typeof payload==="object" && !Array.isArray(payload)
    ? payload as Record<string,unknown> : {};
  const preferred = typeof fields["preferredTimes"]==="string"
    ? fields["preferredTimes"] : typeof fields["preferred_times"]==="string"
    ? fields["preferred_times"] : null;
  const previousReply = typeof fields["reply"]==="string" ? fields["reply"] : null;
  const text = preferred?.trim().slice(0,500) || null;
  const reply = (decisionNote ?? previousReply)?.trim().slice(0,500) || null;
  const stateLabel = status==="PENDING" ? "Waiting for the placement cell"
    : status==="APPROVED" ? "Approved"
    : status==="REJECTED" ? "Not approved" : status==="CANCELLED" ? "Cancelled" : "Unknown status";
  return {preferredTimes:text,reply,stateLabel,decisionMade:["APPROVED","REJECTED","CANCELLED"].includes(status)};
}

function requireLearner(context: RequestContext) {
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    throw new AuthorizationError("placements.read");
  }
  return context.membership;
}

async function loadApplicationContext(
  applicationId: string,
) {
  const [row] = await getDb()
    .select({
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: placementJobs,
      company: placementCompanies,
    })
    .from(placementApplications)
    .innerJoin(
      placementJobRoleOptions,
      and(
        eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
        // DB-066 defense in depth before registered composite FKs: do not
        // read a role option attached to a different placement job.
        eq(placementJobRoleOptions.jobId, placementApplications.jobId),
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

async function loadRequestContext(requestId: string) {
  const [row] = await getDb()
    .select({
      request: placementLearnerRequests,
      application: placementApplications,
      job: placementJobs,
      // Independent legacy FKs are insufficient until DB-066 is registered.
      roundJobId: placementJobRounds.jobId,
      offerApplicationId: placementOffers.applicationId,
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
    .leftJoin(
      placementJobRounds,
      eq(placementJobRounds.id, placementLearnerRequests.roundId),
    )
    .leftJoin(
      placementOffers,
      eq(placementOffers.id, placementLearnerRequests.offerId),
    )
    .where(
      eq(
        placementLearnerRequests.id,
        requestId,
      ),
    )
    .limit(1);

  // Fail closed if a persisted request targets a different job or a
  // different application. DB-066 will enforce this at the SQL layer too.
  if (
    !row ||
    (row.request.roundId !== null && row.roundJobId !== row.job.id) ||
    (row.request.offerId !== null &&
      row.offerApplicationId !== row.application.id)
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_NOT_FOUND",
    );
  }
  return row;
}

function scopeKeyFor(
  input: ReturnType<
    typeof createPlacementRequestInputSchema.parse
  >,
) {
  if (
    input.requestType ===
    "APPLICATION_WITHDRAWAL"
  ) {
    return `APPLICATION_WITHDRAWAL:${input.applicationId}`;
  }
  if (input.requestType === "ROUND_RESCHEDULE") {
    return `ROUND_RESCHEDULE:${input.applicationId}:${input.roundId}`;
  }
  return `OFFER_EXTENSION:${input.applicationId}:${input.offerId}`;
}

async function assertRoundParticipation(
  db: PlacementRequestWriter,
  applicationId: string,
  round: typeof placementJobRounds.$inferSelect,
) {
  const [screening] = await db
    .select({
      status:
        placementApplicationScreenings.status,
    })
    .from(placementApplicationScreenings)
    .where(
      eq(
        placementApplicationScreenings.applicationId,
        applicationId,
      ),
    )
    .limit(1);

  if (
    !screening ||
    screening.status !== "SHORTLISTED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }

  const previousRounds = await db
    .select({
      id: placementJobRounds.id,
    })
    .from(placementJobRounds)
    .where(
      and(
        eq(
          placementJobRounds.jobId,
          round.jobId,
        ),
        lt(
          placementJobRounds.sequence,
          round.sequence,
        ),
        ne(
          placementJobRounds.status,
          "CANCELLED",
        ),
        ne(placementJobRounds.kind, "TALK"),
      ),
    );

  if (previousRounds.length === 0) return;

  const results = await db
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
          previousRounds.map(
            (item) => item.id,
          ),
        ),
      ),
    );

  const passed = new Set(
    results
      .filter(
        (item) => item.outcome === "PASS",
      )
      .map((item) => item.roundId),
  );

  if (
    previousRounds.some(
      (item) => !passed.has(item.id),
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }
}

async function validateRequestTarget(
  input: ReturnType<
    typeof createPlacementRequestInputSchema.parse
  >,
  application: Awaited<
    ReturnType<typeof loadApplicationContext>
  >,
  now: Date,
) {
  if (application.application.status !== "SUBMITTED") {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }

  if (
    input.requestType ===
    "APPLICATION_WITHDRAWAL"
  ) {
    const [activeOffer] = await getDb()
      .select({
        id: placementOffers.id,
      })
      .from(placementOffers)
      .where(
        and(
          eq(
            placementOffers.applicationId,
            application.application.id,
          ),
          eq(placementOffers.status,"ACCEPTED"),
        ),
      )
      .limit(1);

    if (activeOffer) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_EFFECT_INVALID",
      );
    }
  }

  if (input.requestType === "ROUND_RESCHEDULE") {
    const [round] = await getDb()
      .select()
      .from(placementJobRounds)
      .where(
        eq(placementJobRounds.id, input.roundId),
      )
      .limit(1);
    if (!round || round.jobId !== application.job.id) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_TARGET_MISMATCH",
      );
    }
    if (
      round.status !== "SCHEDULED" ||
      input.scheduledAt.getTime() <= now.getTime()
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_EFFECT_INVALID",
      );
    }
    await assertRoundParticipation(
      getDb(),
      application.application.id,
      round,
    );
  }

  if (input.requestType === "OFFER_EXTENSION") {
    const [offer] = await getDb()
      .select()
      .from(placementOffers)
      .where(eq(placementOffers.id, input.offerId))
      .limit(1);
    if (
      !offer ||
      offer.applicationId !== application.application.id
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_TARGET_MISMATCH",
      );
    }
    if (
      offer.status !== "ISSUED" ||
      !offer.expiresAt ||
      (input.expectedExpiresAt!==undefined &&
        offer.expiresAt.toISOString()!==input.expectedExpiresAt) ||
      input.requestedExpiresAt.getTime() <=
        offer.expiresAt.getTime() ||
      input.requestedExpiresAt.getTime() <=
        now.getTime()
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_EFFECT_INVALID",
      );
    }
  }
}

function effectPayloadFor(
  input: ReturnType<
    typeof createPlacementRequestInputSchema.parse
  >,
) {
  if (input.requestType === "ROUND_RESCHEDULE") {
    return {
      scheduledAt: input.scheduledAt.toISOString(),
      timezone: input.timezone,
      preferredTimes: input.preferredTimes?.trim() || null,
      mode: input.mode,
      venue:
        input.mode === "ON_CAMPUS"
          ? input.venue ?? null
          : null,
      meetingUrl:
        input.mode === "VIRTUAL"
          ? input.meetingUrl ?? null
          : null,
    } satisfies RescheduleEffect;
  }
  if (input.requestType === "OFFER_EXTENSION") {
    return {
      requestedExpiresAt:
        input.requestedExpiresAt.toISOString(),
    } satisfies OfferExtensionEffect;
  }
  return {};
}

export async function createPlacementRequest(
  context: RequestContext,
  rawInput: CreatePlacementRequestInput,
) {
  const membership = requireLearner(context);
  await requireLearnerPlacementAccess(context);
  const input =
    createPlacementRequestInputSchema.parse(
      rawInput,
    );
  const current = await loadApplicationContext(
    input.applicationId,
  );

  if (
    current.application.membershipId !== membership.id ||
    current.job.collegeId !== membership.collegeId
  ) {
    throw new AuthorizationError("placements.read");
  }

  const now = new Date();
  await validateRequestTarget(input, current, now);
  const scopeKey = scopeKeyFor(input);
  const effectPayload = effectPayloadFor(input);
  const db = getDb();

  const created = await db.transaction(async (tx) => {
    if(input.requestType==="APPLICATION_WITHDRAWAL"&&input.expectedUpdatedAt){
      const [locked]=await tx.select({id:placementApplications.id})
        .from(placementApplications).where(and(
          eq(placementApplications.id,input.applicationId),
          eq(placementApplications.membershipId,membership.id),
          eq(placementApplications.status,"SUBMITTED"),
          sql`date_trunc('milliseconds', ${placementApplications.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
        )).for("update").limit(1);
      if(!locked)throw new PlacementsServiceError("PLACEMENT_REQUEST_STALE");
      const [activeOffer]=await tx.select({id:placementOffers.id}).from(placementOffers)
        .where(and(eq(placementOffers.applicationId,input.applicationId),eq(placementOffers.status,"ACCEPTED"))).limit(1);
      if(activeOffer)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
    }
    if(input.requestType==="OFFER_EXTENSION"){
      // Revalidate against a locked, persisted offer rather than a stale card.
      const [currentOffer]=await tx.select({
        applicationId:placementOffers.applicationId,
        status:placementOffers.status,
        expiresAt:placementOffers.expiresAt,
      }).from(placementOffers).where(eq(placementOffers.id,input.offerId))
        .for("update").limit(1);
      if(!currentOffer || currentOffer.applicationId!==input.applicationId ||
        currentOffer.status!=="ISSUED" || !currentOffer.expiresAt ||
        (input.expectedExpiresAt!==undefined &&
          currentOffer.expiresAt.toISOString()!==input.expectedExpiresAt) ||
        input.requestedExpiresAt.getTime()<=currentOffer.expiresAt.getTime() ||
        input.requestedExpiresAt.getTime()<=now.getTime()){
        throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
      }
    }
    const [request] = await tx
      .insert(placementLearnerRequests)
      .values({
        applicationId: current.application.id,
        learnerMembershipId: current.application.membershipId,
        requestType: input.requestType,
        roundId:
          input.requestType === "ROUND_RESCHEDULE"
            ? input.roundId
            : null,
        offerId:
          input.requestType === "OFFER_EXTENSION"
            ? input.offerId
            : null,
        scopeKey,
        reason: input.reason,
        effectPayload,
        // Explicit pending status also supports databases whose default was
        // created before the latest schema snapshot.
        status: "PENDING",
        requestedByUserId: context.user.id,
        requestedAt: now,
      })
      .onConflictDoNothing()
      .returning();

    if (!request) return null;

    const submittedEvent = await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_REQUEST_SUBMITTED,
        collegeId: current.job.collegeId,
        subjectType: "placement_request",
        subjectId: request.id,
        subjectLabel: current.roleOption.title,
        summary:
          `${input.requestType} request submitted for ${current.roleOption.title}`,
        metadata: {
          requestType: input.requestType,
          applicationId: current.application.id,
          jobId: current.job.id,
          roundId:
            input.requestType === "ROUND_RESCHEDULE"
              ? input.roundId
              : null,
          offerId:
            input.requestType === "OFFER_EXTENSION"
              ? input.offerId
              : null,
        },
        groupKey:
          `placement-job:${current.job.id}:requests`,
        dedupeKey:
          `placement-request:${request.id}:submitted`,
      },
    );

    // Notify active placement-cell members as part of the request transaction.
    const tpoRecipients = await tx.select({ userId: collegeMemberships.userId })
      .from(collegeMemberships)
      .innerJoin(membershipRoles, eq(membershipRoles.membershipId, collegeMemberships.id))
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(and(
        eq(collegeMemberships.collegeId, current.job.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(membershipRoles.role, "TPO"),
        eq(users.platformStatus, "ACTIVE"),
      ));
    const distinctRecipients = [...new Set(tpoRecipients.map(row => row.userId))];
    for (let index = 0; index < distinctRecipients.length; index += 200) {
      await tx.insert(inAppNotifications).values(
        distinctRecipients.slice(index, index + 200).map(userId => ({
          userId,
          eventId: submittedEvent.id,
          title: "New " + input.requestType.toLowerCase().replaceAll("_", " ") + " request",
          body: "A learner has requested a decision for " + current.roleOption.title + ".",
          actionHref: "/tpo/requests",
        })),
      ).onConflictDoNothing();
    }

    return request;
  });

  if (created) return created;

  const [existing] = await db
    .select()
    .from(placementLearnerRequests)
    .where(
      and(
        eq(
          placementLearnerRequests.scopeKey,
          scopeKey,
        ),
        eq(
          placementLearnerRequests.status,
          "PENDING",
        ),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_CONFLICT",
    );
  }

  const sameTarget =
    existing.requestType === input.requestType &&
    existing.roundId ===
      (input.requestType === "ROUND_RESCHEDULE"
        ? input.roundId
        : null) &&
    existing.offerId ===
      (input.requestType === "OFFER_EXTENSION"
        ? input.offerId
        : null);
  const samePayload =
    JSON.stringify(
      existing.effectPayload ?? {},
    ) === JSON.stringify(effectPayload);

  if (
    !sameTarget ||
    existing.reason !== input.reason ||
    !samePayload
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_CONFLICT",
    );
  }
  return existing;
}

function parseRescheduleEffect(
  payload: unknown,
): RescheduleEffect {
  const value = payload as Partial<RescheduleEffect>;
  if (
    typeof value.scheduledAt !== "string" ||
    typeof value.timezone !== "string" ||
    (value.mode !== "ON_CAMPUS" &&
      value.mode !== "VIRTUAL") ||
    (value.mode === "ON_CAMPUS" &&
      typeof value.venue !== "string") ||
    (value.mode === "VIRTUAL" &&
      typeof value.meetingUrl !== "string")
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }
  return {
    scheduledAt: value.scheduledAt,
    timezone: value.timezone,
    preferredTimes: typeof value.preferredTimes==="string"
      ? value.preferredTimes.trim().slice(0,200) : null,
    mode: value.mode,
    venue:
      value.mode === "ON_CAMPUS"
        ? value.venue ?? null
        : null,
    meetingUrl:
      value.mode === "VIRTUAL"
        ? value.meetingUrl ?? null
        : null,
  };
}

function parseOfferExtensionEffect(
  payload: unknown,
): OfferExtensionEffect {
  const value =
    payload as Partial<OfferExtensionEffect>;
  if (typeof value.requestedExpiresAt !== "string") {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }
  return {
    requestedExpiresAt:
      value.requestedExpiresAt,
  };
}

async function applyApprovedEffect(
  db: PlacementRequestTransaction,
  context: RequestContext,
  request: typeof placementLearnerRequests.$inferSelect,
  job: typeof placementJobs.$inferSelect,
  now: Date,
) {
  // General-support requests may not refer to an application; effectful
  // application requests must fail closed before issuing an SQL lookup.
  if (!request.applicationId) {
    throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
  }
  const [application] = await db
    .select()
    .from(placementApplications)
    .where(
      eq(
        placementApplications.id,
        request.applicationId,
      ),
    )
    .for("update")
    .limit(1);

  if (
    !application ||
    application.jobId !== job.id ||
    application.status !== "SUBMITTED"
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }

  if (
    request.requestType ===
    "APPLICATION_WITHDRAWAL"
  ) {
    // ISSUED means released but not accepted. Decline those offers during
    // a withdrawal, but leave ACCEPTED (placed) offers for Offers reversal.
    const offers = await db.select({id:placementOffers.id,status:placementOffers.status})
      .from(placementOffers)
      .where(and(eq(placementOffers.applicationId,application.id),
        inArray(placementOffers.status,["ISSUED","ACCEPTED"])))
      .for("update");
    if(offers.some(offer=>offer.status==="ACCEPTED")){
      throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
    }
    for(const offer of offers.filter(offer=>offer.status==="ISSUED")){
      const [closed]=await db.update(placementOffers)
        .set({status:"DECLINED",respondedByUserId:context.user.id,respondedAt:now,updatedAt:now})
        .where(and(eq(placementOffers.id,offer.id),eq(placementOffers.status,"ISSUED")))
        .returning({id:placementOffers.id});
      if(!closed)throw new PlacementsServiceError("PLACEMENT_REQUEST_EFFECT_INVALID");
      await db.insert(placementOfferStatusHistory).values({
        offerId:offer.id,fromStatus:"ISSUED",toStatus:"DECLINED",
        actorUserId:context.user.id,reason:"Withdrawal approved by the placement cell",
      });
    }

    const [updated] = await db
      .update(placementApplications)
      .set({
        status: "WITHDRAWN",
        withdrawnAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            placementApplications.id,
            application.id,
          ),
          eq(
            placementApplications.status,
            "SUBMITTED",
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_EFFECT_INVALID",
      );
    }

    await recordApplicationStatusTransition(db,{
      applicationId: application.id,
      fromStatus: "SUBMITTED",
      toStatus: "WITHDRAWN",
      actorUserId: context.user.id,
      reason: request.reason,
    });

    await recordActivityEventInTransaction(
      db,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_APPLICATION_WITHDRAWN,
        collegeId: job.collegeId,
        subjectType: "placement_application",
        subjectId: application.id,
        subjectLabel: job.title,
        summary:
          `Application withdrawal approved for ${job.title}`,
        metadata: {
          jobId: job.id,
          requestId: request.id,
          membershipId: application.membershipId,
        },
        groupKey:
          `placement-job:${job.id}:applications`,
        dedupeKey:
          `placement-application:${application.id}:withdrawn`,
      },
    );
    return;
  }

  if (request.requestType === "ROUND_RESCHEDULE") {
    if (!request.roundId) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_TARGET_MISMATCH",
      );
    }

    const [round] = await db
      .select()
      .from(placementJobRounds)
      .where(
        eq(
          placementJobRounds.id,
          request.roundId,
        ),
      )
      .for("update")
      .limit(1);

    if (
      !round ||
      round.jobId !== job.id ||
      round.status !== "SCHEDULED"
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_EFFECT_INVALID",
      );
    }

    await assertRoundParticipation(
      db,
      application.id,
      round,
    );

    const effect = parseRescheduleEffect(
      request.effectPayload,
    );
    const scheduledAt = new Date(effect.scheduledAt);
    if (
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= now.getTime()
    ) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_EFFECT_INVALID",
      );
    }

    await db
      .insert(placementApplicationRoundExceptions)
      .values({
        applicationId: application.id,
        roundId: round.id,
        requestId: request.id,
        scheduledAt,
        timezone: effect.timezone,
        mode: effect.mode,
        venue: effect.venue,
        meetingUrl: effect.meetingUrl,
      })
      .onConflictDoUpdate({
        target: [
          placementApplicationRoundExceptions.applicationId,
          placementApplicationRoundExceptions.roundId,
        ],
        set: {
          requestId: request.id,
          scheduledAt,
          timezone: effect.timezone,
          mode: effect.mode,
          venue: effect.venue,
          meetingUrl: effect.meetingUrl,
          updatedAt: now,
        },
      });
    return;
  }

  if (!request.offerId) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_TARGET_MISMATCH",
    );
  }

  const [offer] = await db
    .select()
    .from(placementOffers)
    .where(
      eq(placementOffers.id, request.offerId),
    )
    .for("update")
    .limit(1);

  if (
    !offer ||
    offer.applicationId !== application.id ||
    offer.status !== "ISSUED" ||
    !offer.expiresAt
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }

  const effect = parseOfferExtensionEffect(
    request.effectPayload,
  );
  const requestedExpiresAt = new Date(
    effect.requestedExpiresAt,
  );
  if (
    Number.isNaN(requestedExpiresAt.getTime()) ||
    requestedExpiresAt.getTime() <= now.getTime() ||
    requestedExpiresAt.getTime() <=
      offer.expiresAt.getTime()
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_REQUEST_EFFECT_INVALID",
    );
  }

  await db
    .update(placementOffers)
    .set({
      expiresAt: requestedExpiresAt,
      updatedAt: now,
    })
    .where(eq(placementOffers.id, offer.id));
}

export async function actOnPlacementRequest(
  context: RequestContext,
  requestIdInput: string,
  rawInput: PlacementRequestActionInput,
  expectedUpdatedAt?: string,
) {
  const requestId =
    placementRequestIdSchema.parse(
      requestIdInput,
    );
  const input =
    placementRequestActionSchema.parse(
      rawInput,
    );
  const current =
    await loadRequestContext(requestId);

  if (input.action === "CANCEL") {
    const membership = requireLearner(context);
    await requireLearnerPlacementAccess(context);
    if (
      membership.id !==
        current.application.membershipId ||
      membership.collegeId !== current.job.collegeId
    ) {
      throw new AuthorizationError("placements.read");
    }
  } else {
    await requirePlacementManageScope(
      context,
      current.job.collegeId,
    );
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(placementLearnerRequests)
      .where(
        eq(
          placementLearnerRequests.id,
          requestId,
        ),
      )
      .for("update")
      .limit(1);

    if (!request) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_NOT_FOUND",
      );
    }
    if (request.status !== "PENDING" ||
      (expectedUpdatedAt && request.updatedAt.toISOString() !== expectedUpdatedAt)) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_INVALID_STATE",
      );
    }

    // DB-066: the preflight context is advisory. A concurrent SQL writer
    // could retarget a request after that read but before this row lock.
    // Never apply, reject or cancel a decision against a different parent.
    if (request.applicationId !== current.application.id ||
        request.requestType !== current.request.requestType ||
        request.roundId !== current.request.roundId ||
        request.offerId !== current.request.offerId) {
      throw new PlacementsServiceError("PLACEMENT_REQUEST_TARGET_MISMATCH");
    }
    const [persistedApplication] = await tx.select({
      id:placementApplications.id,
      jobId:placementApplications.jobId,
      membershipId:placementApplications.membershipId,
    }).from(placementApplications).where(
      eq(placementApplications.id,request.applicationId)
    ).for("share").limit(1);
    if (!persistedApplication ||
        persistedApplication.jobId !== current.job.id ||
        persistedApplication.membershipId !== current.application.membershipId) {
      throw new PlacementsServiceError("PLACEMENT_REQUEST_TARGET_MISMATCH");
    }

    // The request can remain open after membership suspension, role removal
    // or account disablement. Rebuild permissions from locked persisted rows,
    // so any racing revoke either precedes this decision or waits for commit.
    const requiredPermission = input.action === "CANCEL"
      ? "placements.read" as const : "placements.manage" as const;
    await assertPersistedPlatformPermission(tx,context,requiredPermission,{
      collegeId:current.job.collegeId,
    });

    const now = new Date();
    let nextStatus:
      | "APPROVED"
      | "REJECTED"
      | "CANCELLED";

    if (input.action === "APPROVE") {
      await applyApprovedEffect(
        tx,
        context,
        request,
        current.job,
        now,
      );
      nextStatus = "APPROVED";
    } else if (input.action === "REJECT") {
      nextStatus = "REJECTED";
    } else {
      nextStatus = "CANCELLED";
    }

    const [updated] = await tx
      .update(placementLearnerRequests)
      .set({
        status: nextStatus,
        decidedByUserId: context.user.id,
        decidedAt: now,
        decisionNote:
          input.action === "CANCEL"
            ? null
            : input.note ?? null,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            placementLearnerRequests.id,
            request.id,
          ),
          eq(
            placementLearnerRequests.status,
            "PENDING",
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new PlacementsServiceError(
        "PLACEMENT_REQUEST_INVALID_STATE",
      );
    }

    const decisionEvent = await recordActivityEventInTransaction(
      tx,
      context,
      {
        eventType:
          ACTIVITY_EVENT_TYPES.PLACEMENTS_REQUEST_DECIDED,
        collegeId: current.job.collegeId,
        subjectType: "placement_request",
        subjectId: request.id,
        subjectLabel: current.job.title,
        summary:
          `${request.requestType} request ${nextStatus.toLowerCase()} for ${current.job.title}`,
        metadata: {
          requestType: request.requestType,
          status: nextStatus,
          applicationId:
            current.application.id,
          jobId: current.job.id,
          roundId: request.roundId,
          offerId: request.offerId,
        },
        groupKey:
          `placement-job:${current.job.id}:requests`,
        dedupeKey:
          `placement-request:${request.id}:${nextStatus.toLowerCase()}`,
      },
    );

    if (nextStatus !== "CANCELLED") {
      await deliverRecordedLearnerPlacementEvent(tx,{
        eventId:decisionEvent.id,collegeId:current.job.collegeId,
        membershipId:current.application.membershipId,
        jobId:current.job.id,applicationId:current.application.id,
        kind:request.requestType==="ROUND_RESCHEDULE"?"RESCHEDULE_DECIDED":"REQUEST_DECIDED",
        subject:(nextStatus==="APPROVED"?"Approved: ":"Rejected: ")+current.job.title,
        requestDecisionStatus:nextStatus,
        requestDecisionNote:nextStatus==="REJECTED"?updated.decisionNote??undefined:undefined,
      });
    }

    return updated;
  });
}

function requestListQuery() {
  return getDb()
    .select({
      request: placementLearnerRequests,
      application: placementApplications,
      roleOption: placementJobRoleOptions,
      job: {
        id: placementJobs.id,
        title: placementJobs.title,
        collegeId: placementJobs.collegeId,
      },
      company: {
        id: placementCompanies.id,
        name: placementCompanies.name,
      },
      round: {
        id: placementJobRounds.id,
        name: placementJobRounds.name,
        scheduledAt:
          placementJobRounds.scheduledAt,
        timezone: placementJobRounds.timezone,
        mode: placementJobRounds.mode,
        venue: placementJobRounds.venue,
        meetingUrl:
          placementJobRounds.meetingUrl,
      },
      offer: {
        id: placementOffers.id,
        roleTitle: placementOffers.roleTitle,
        expiresAt: placementOffers.expiresAt,
        status: placementOffers.status,
      },
      exception:
        placementApplicationRoundExceptions,
      candidate: {
        membershipId: collegeMemberships.id,
        displayName: users.displayName,
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
      placementJobRoleOptions,
      and(
        eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
        // DB-066 defense in depth before registered composite FKs: do not
        // read a role option attached to a different placement job.
        eq(placementJobRoleOptions.jobId, placementApplications.jobId),
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
    .leftJoin(
      placementJobRounds,
      and(
        eq(placementJobRounds.id, placementLearnerRequests.roundId),
        eq(placementJobRounds.jobId, placementApplications.jobId),
      ),
    )
    .leftJoin(
      placementOffers,
      and(
        eq(placementOffers.id, placementLearnerRequests.offerId),
        eq(placementOffers.applicationId, placementApplications.id),
      ),
    )
    .leftJoin(
      placementApplicationRoundExceptions,
      and(
        eq(placementApplicationRoundExceptions.requestId, placementLearnerRequests.id),
        eq(placementApplicationRoundExceptions.applicationId, placementApplications.id),
        eq(placementApplicationRoundExceptions.roundId, placementLearnerRequests.roundId),
        eq(placementLearnerRequests.requestType, "ROUND_RESCHEDULE"),
      ),
    );
}

export async function listOwnPlacementRequests(
  context: RequestContext,
) {
  const membership = requireLearner(context);
  await requireLearnerPlacementAccess(context);
  return requestListQuery()
    .where(and(
      eq(placementApplications.membershipId, membership.id),
      // A malformed target cannot expose unrelated interview/offer metadata.
      or(isNull(placementLearnerRequests.roundId),
        eq(placementJobRounds.id, placementLearnerRequests.roundId)),
      or(isNull(placementLearnerRequests.offerId),
        eq(placementOffers.id, placementLearnerRequests.offerId)),
    ))
    .orderBy(
      desc(
        placementLearnerRequests.requestedAt,
      ),
    );
}

export async function listPlacementJobRequests(
  context: RequestContext,
  jobIdInput: string,
) {
  const jobId =
    placementJobIdSchema.parse(jobIdInput);
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

  return requestListQuery()
    .where(and(
      eq(placementApplications.jobId, job.id),
      or(isNull(placementLearnerRequests.roundId),
        eq(placementJobRounds.id, placementLearnerRequests.roundId)),
      or(isNull(placementLearnerRequests.offerId),
        eq(placementOffers.id, placementLearnerRequests.offerId)),
    ))
    .orderBy(
      asc(placementLearnerRequests.status),
      desc(
        placementLearnerRequests.requestedAt,
      ),
    );
}

export async function getLearnerPlacementRequestWorkspace(
  context: RequestContext,
) {
  const membership = requireLearner(context);
  await requireLearnerPlacementAccess(context);
  const db = getDb();
  const [deadlineAvailable,confirmationReady]=await Promise.all([
    learnerPlacementRoundDeadlineAvailable(),learnerRoundConfirmationReady(),
  ]);

  const [requests, rounds, offers] =
    await Promise.all([
      listOwnPlacementRequests(context),
      db
        .select({
          applicationId:
            placementApplications.id,
          // Learner-specific confirmed booking is not the same as a
          // drive-wide scheduled round. Keep planned rounds for schedule
          // context, but make the withdrawal rule depend on the booking.
          booked: sql<boolean>`exists(select 1 from placement_round_candidate_slots cs
            where cs.application_id = ${placementApplications.id}
              and cs.round_id = ${placementJobRounds.id}
              and cs.status = 'BOOKED')`,
          learnerConfirmedAt:confirmationReady?
            sql<Date|null>`(SELECT cs.learner_confirmed_at FROM placement_round_candidate_slots cs
              WHERE cs.application_id=${placementApplications.id}
                AND cs.round_id=${placementJobRounds.id} AND cs.status='BOOKED' LIMIT 1)`:
            sql<Date|null>`null`,
          jobId: placementJobs.id,
          roundId: placementJobRounds.id,
          roundName: placementJobRounds.name,
          roundKind: placementJobRounds.kind,
          testUrl: placementJobRounds.testUrl,
          whatToBring: placementJobRounds.whatToBring,
          platform: placementJobRounds.platform,
          assessmentDueAt:deadlineAvailable?sql<Date>`"placement_job_rounds"."assessment_due_at"`:sql<Date|null>`null`,
          sequence:
            placementJobRounds.sequence,
          durationMinutes: placementJobRounds.durationMinutes,
          scheduledAt:
            placementJobRounds.scheduledAt,
          timezone:
            placementJobRounds.timezone,
          mode: placementJobRounds.mode,
          venue: placementJobRounds.venue,
          meetingUrl:
            placementJobRounds.meetingUrl,
          roleTitle:
            placementJobRoleOptions.title,
          companyName:
            placementCompanies.name,
          companyLogoUrl:placementCompanies.logoPublicUrl,
          exception:
            placementApplicationRoundExceptions,
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
          and(
        eq(placementJobRoleOptions.id, placementApplications.roleOptionId),
        // DB-066 defense in depth before registered composite FKs: do not
        // read a role option attached to a different placement job.
        eq(placementJobRoleOptions.jobId, placementApplications.jobId),
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
          placementJobRounds,
          eq(
            placementJobRounds.jobId,
            placementJobs.id,
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
          placementApplicationRoundExceptions,
          and(
            eq(
              placementApplicationRoundExceptions.applicationId,
              placementApplications.id,
            ),
            eq(
              placementApplicationRoundExceptions.roundId,
              placementJobRounds.id,
            ),
          ),
        )
        .where(
          and(
            eq(
              placementApplications.membershipId,
              membership.id,
            ),
            eq(
              placementApplications.status,
              "SUBMITTED",
            ),
            eq(
              placementApplicationScreenings.status,
              "SHORTLISTED",
            ),
            // Only published drives may expose a live candidate schedule.
            // Closed/cancelled drives retain audit history, not actionable rounds.
            eq(
              placementJobs.status,
              "PUBLISHED",
            ),
            eq(
              placementJobRounds.status,
              "SCHEDULED",
            ),
          ),
        )
        .orderBy(
          asc(placementJobRounds.scheduledAt),
        ),
      db
        .select({
          applicationId:
            placementApplications.id,
          offerId: placementOffers.id,
          roleTitle:
            placementOffers.roleTitle,
          companyName:
            placementCompanies.name,
          expiresAt:
            placementOffers.expiresAt,
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
        .where(
          and(
            eq(
              placementApplications.membershipId,
              membership.id,
            ),
            eq(
              placementOffers.status,
              "ISSUED",
            ),
          ),
        )
        .orderBy(asc(placementOffers.expiresAt)),
    ]);

  return {
    requests: requests.map(row => ({
      ...row,
      legacyReschedule: row.request.requestType==="ROUND_RESCHEDULE"
        ? legacyRescheduleRequestDisplay(
          row.request.effectPayload,row.request.status,row.request.decisionNote,
        ) : null,
    })),
    rounds,
    offers,
  };
}
