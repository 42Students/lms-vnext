import "server-only";

import { and, asc, eq, inArray, isNull, lte, ne, notExists } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  collegeMemberships,
  placementLearnerGeneralRequests,
  placementJobs,
  placementJoiningHistory,
  placementJoiningOutcomes,
  placementOffers,
  placementOfferStatusHistory,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  canRecordTpoActualJoiningDate,
  canRecordTpoOfferAction,
  tpoOfferLifecycleInputSchema,
} from "./tpo-offer-lifecycle-model";
import { placementJobIdSchema } from "./validation";
import {requireTpoJobActor} from "./tpo-job-write-base";
import {cascadeTpoRecordedAcceptance} from "./tpo-offer-acceptance-cascade";
import {deliverRecordedLearnerPlacementEvent} from "./learner-placement-event-delivery";

/**
 * All-or-nothing and locked in offer UUID order to avoid duplicate updates
 * and overlapping-batch deadlocks. No external or unregistered tables.
 * A TPO-recorded acceptance/decline requires a reason stating the evidence;
 * the status history attributes the action to the TPO, not to the learner.
 */
export async function recordTpoOfferLifecycle(
  context: RequestContext,
  rawJobId: unknown,
  raw: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const jobId = placementJobIdSchema.parse(rawJobId);
  const input = tpoOfferLifecycleInputSchema.parse(raw);
  const [job] = await getDb().select({
    id: placementJobs.id,
    title: placementJobs.title,
    collegeId: placementJobs.collegeId,
  }).from(placementJobs).where(and(
    eq(placementJobs.id, jobId),
    eq(placementJobs.collegeId, collegeId),
  )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await requirePlacementManageScope(context, job.collegeId);

  const db = getDb();
  return db.transaction(async (tx) => {
    // A stale TPO session must not be able to mutate offers after its
    // membership/role was revoked between form preview and commit.
    await requireTpoJobActor(tx,context);
    const scoped = await tx.select({ offerId: placementOffers.id,
      membershipId:placementApplications.membershipId })
      .from(placementOffers)
      .innerJoin(placementApplications, eq(
        placementApplications.id, placementOffers.applicationId,
      ))
      .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
      .where(and(
        eq(placementJobs.id, job.id),
        eq(placementJobs.collegeId, collegeId),
        inArray(placementOffers.id, input.offerIds),
      ));
    if (scoped.length !== input.offerIds.length) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
    }

    // Canonical learner acceptance also takes membership before offer locks.
    // All selected learner locks are acquired in UUID order to serialize
    // multi-offer decisions without a deadlock or double acceptance.
    const memberIds=[...new Set(scoped.map(row=>row.membershipId))].sort();
    const lockedMembers=await tx.select({id:collegeMemberships.id})
      .from(collegeMemberships)
      .where(and(inArray(collegeMemberships.id,memberIds),
        eq(collegeMemberships.collegeId,collegeId)))
      .orderBy(asc(collegeMemberships.id)).for("update");
    if(lockedMembers.length!==memberIds.length)
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
    const membershipByOffer=new Map(scoped.map(row=>[row.offerId,row.membershipId]));

    // Every current offer is locked and revalidated under the same transaction.
    const offers = await tx.select().from(placementOffers)
      .where(inArray(placementOffers.id, input.offerIds))
      .orderBy(asc(placementOffers.id)).for("update");
    const now = new Date();
    const items: {
      offerId: string;
      action: typeof input.action;
      status: string;
      joiningStatus: string | null;
      provisionalUntil: string | null;
      finalized: boolean | null;
    }[] = [];
    for (const offer of offers) {
      if (offer.status !== input.expectedStatus) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
      }
      const [currentJoining] = await tx.select()
        .from(placementJoiningOutcomes)
        .where(eq(placementJoiningOutcomes.offerId, offer.id))
        .for("update").limit(1);
      if (!canRecordTpoOfferAction(input.action, offer.status, currentJoining?.status ?? null)) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
      }
      // A matured acceptance has already cascaded changes to sibling offers
      // and applications. Generic withdrawal cannot leave those side effects
      // behind; it must go through the dedicated audited cascade-undo flow.
      if (input.action === "WITHDRAW" &&
          offer.status === "ACCEPTED" && offer.cascadeId !== null) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
      }
      if (input.action === "RECORD_JOINED" &&
          !canRecordTpoActualJoiningDate(input.joiningDate!, now)) {
        throw new PlacementsServiceError("PLACEMENT_JOINING_NOT_READY");
      }
      // Imported employer acceptance is provisional until the learner's
      // 48-hour dispute window has closed and the scheduled cascade succeeded.
      if (input.action === "RECORD_JOINED" &&
          offer.acceptanceChannel === "EXTERNAL_IMPORT" &&
          (!offer.cascadeId || (offer.acceptedDisputableUntil &&
            offer.acceptedDisputableUntil > now))) {
        throw new PlacementsServiceError("PLACEMENT_JOINING_NOT_READY");
      }
      if(input.action==="RECORD_ACCEPTED"){
        const membershipId=membershipByOffer.get(offer.id)!;
        // Accepting through a TPO evidence record must not bypass the
        // canonical one-accepted-offer-per-learner rule across drives.
        // The membership lock above serializes this with learner decisions.
        const [alreadyAccepted]=await tx.select({id:placementOffers.id})
          .from(placementOffers)
          .innerJoin(placementApplications,
            eq(placementApplications.id,placementOffers.applicationId))
          .innerJoin(placementJobs,
            eq(placementJobs.id,placementApplications.jobId))
          .where(and(
            eq(placementApplications.membershipId,membershipId),
            eq(placementJobs.collegeId,collegeId),
            ne(placementOffers.id,offer.id),
            eq(placementOffers.status,"ACCEPTED"),
          )).limit(1);
        if(alreadyAccepted)throw new PlacementsServiceError("PLACEMENT_OFFER_ACTIVE_EXISTS");
      }
      if ((input.action === "RECORD_ACCEPTED" ||
            input.action === "RECORD_DECLINED") &&
          offer.expiresAt && offer.expiresAt <= now) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_EXPIRED");
      }
      let nextStatus: (typeof placementOffers.$inferSelect)["status"] = offer.status;
      if (input.action === "EXTEND") {
        const newExpiry = new Date(input.expiresAt!);
        if (newExpiry <= now ||
            (offer.expiresAt !== null && newExpiry <= offer.expiresAt) ||
            newExpiry <= offer.issuedAt) {
          throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
        }
        await tx.update(placementOffers)
          .set({ expiresAt: newExpiry, updatedAt: now })
          .where(eq(placementOffers.id, offer.id));
      } else if (input.action === "RECORD_JOINED") {
        await tx.insert(placementJoiningOutcomes)
          .values({ offerId: offer.id }).onConflictDoNothing();
        const [joined] = await tx.update(placementJoiningOutcomes)
          .set({
            status: "JOINED",
            joiningDate: input.joiningDate!,
            reason: null,
            recordedByUserId: context.user.id,
            recordedAt: now,
            updatedAt: now,
          }).where(and(
            eq(placementJoiningOutcomes.offerId, offer.id),
            eq(placementJoiningOutcomes.status, "PENDING"),
          )).returning();
        if (!joined) throw new PlacementsServiceError("PLACEMENT_JOINING_NOT_READY");
        await tx.insert(placementJoiningHistory).values({
          offerId: offer.id,
          fromStatus: "PENDING",
          toStatus: "JOINED",
          joiningDate: input.joiningDate!,
          reason: input.reason,
          actorUserId: context.user.id,
        });
      } else {
        nextStatus =
          input.action === "RECORD_ACCEPTED" ? "ACCEPTED" :
          input.action === "RECORD_DECLINED" ? "DECLINED" : "WITHDRAWN";
        const [updated] = await tx.update(placementOffers).set({
          status: nextStatus,
          // TPO records the employer's report, never impersonates learner
          // consent. Accepted externally is not final or placed until a
          // dispute-aware system sweep matures it after 48 hours.
          ...(nextStatus === "ACCEPTED" ? {
            acceptanceChannel: "EXTERNAL_IMPORT",
            acceptedDisputableUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000),
            cascadeId: null,
          } : {}),
          ...(nextStatus === "WITHDRAWN" ? {
            withdrawnByUserId: context.user.id,
            withdrawnAt: now,
            // Revocation closes an outstanding external dispute window.
            // A finalized acceptance still requires the dedicated reversal
            // path to undo sibling offer/application consequences.
            acceptedDisputableUntil: null,
          } : {
            respondedByUserId: context.user.id,
            respondedAt: now,
          }),
          updatedAt: now,
        }).where(and(
          eq(placementOffers.id, offer.id),
          eq(placementOffers.status, offer.status),
        )).returning();
        if (!updated) throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
        // EXTERNAL_IMPORT acceptance deliberately does not cascade here.
        // finalizeMaturedExternalTpoAcceptances performs the cascade after
        // the learner's dispute window, under a separate system authority.
        await tx.insert(placementOfferStatusHistory).values({
          offerId: offer.id,
          fromStatus: offer.status,
          toStatus: nextStatus,
          actorUserId: context.user.id,
          reason: nextStatus === "ACCEPTED"
            ? input.reason + " (external acceptance; 48h dispute window)"
            : input.reason,
        });
        if (nextStatus === "ACCEPTED") {
          await tx.insert(placementJoiningOutcomes)
            .values({ offerId: offer.id }).onConflictDoNothing();
        }
      }
      const lifecycleEvent=await recordActivityEventInTransaction(tx, context, {
        eventType: input.action === "RECORD_JOINED"
          ? ACTIVITY_EVENT_TYPES.PLACEMENTS_JOINING_RECORDED
          : ACTIVITY_EVENT_TYPES.PLACEMENTS_OFFER_RESPONDED,
        collegeId,
        subjectType: "placement_offer",
        subjectId: offer.id,
        subjectLabel: offer.roleTitle,
        summary: "TPO recorded offer action: " + input.action + " for " + job.title,
        metadata: {
          jobId,
          offerId: offer.id,
          action: input.action,
          actorRole: "TPO",
          previousStatus: offer.status,
          nextStatus,
          reason: input.reason,
          cascadeId:offer.cascadeId,
          cascadedOfferCount:0,
          withdrawnApplicationCount:0,
        },
        groupKey: "placement-job:" + jobId + ":offers",
      });
      // One persisted event is the dedupe anchor for the learner notice.
      // The same transaction keeps the status, audit and notification
      // consistent; learner preferences and active membership are rechecked.
      await deliverRecordedLearnerPlacementEvent(tx,{
        eventId:lifecycleEvent.id,collegeId,
        membershipId:membershipByOffer.get(offer.id)!,
        kind:"APPLICATION_STATUS_CHANGED",
        subject:input.action==="RECORD_JOINED"
          ? "Joining confirmed for "+job.title
          : input.action==="EXTEND"
            ? "Offer deadline extended for "+job.title
            : input.action === "RECORD_ACCEPTED"
              ? "Employer reported your acceptance for " + job.title +
                ". If this is incorrect, dispute within 48 hours."
              : "Employer offer decision updated for "+job.title,
      });
      items.push({
        offerId: offer.id,
        action: input.action,
        status: nextStatus,
        joiningStatus: input.action === "RECORD_JOINED"
          ? "JOINED" : currentJoining?.status ?? null,
        provisionalUntil: input.action === "RECORD_ACCEPTED"
          ? new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
          : offer.acceptanceChannel === "EXTERNAL_IMPORT" && !offer.cascadeId &&
            nextStatus === "ACCEPTED"
            ? offer.acceptedDisputableUntil?.toISOString() ?? null
            : null,
        finalized: nextStatus === "ACCEPTED"
          ? (input.action !== "RECORD_ACCEPTED" &&
              (offer.acceptanceChannel !== "EXTERNAL_IMPORT" || Boolean(offer.cascadeId)))
          : null,
      });
    }
    return { updated: items.length, items };
  });
}


/**
 * Invoked only by the lease-protected internal offer-expiry scheduler (every 15 minutes).
 * This is not a user-facing mutation and must never be exposed by an
 * unprotected route. Mature offers are scanned in bounded batches; each
 * tenant/learner is locked and rechecked inside its own transaction.
 * Failed rows remain eligible for a later idempotent retry. The same scheduler\n * also runs ISSUED offer expiry (placement-offer-expiry-sweep-service),\n * so both legacy due selectors are applied, never just exposed as reports.
 */
export async function finalizeMaturedExternalTpoAcceptances(
  now: Date = new Date(),
  batchSize = 40,
) {
  // A zero-sized sweep is an intentional no-op; never mutate one offer
  // because a caller passed zero, NaN, or a negative batch size.
  const limit = Number.isFinite(batchSize)
    ? Math.max(0, Math.min(100, Math.trunc(batchSize)))
    : 0;
  if (limit === 0) {
    return { examined: 0, finalized: 0, disputed: 0, skipped: 0, failed: 0 };
  }
  const db = getDb();
  const due = await db.select({
    offerId: placementOffers.id,
    membershipId: placementApplications.membershipId,
    collegeId: placementJobs.collegeId,
  }).from(placementOffers)
    .innerJoin(placementApplications,
      eq(placementApplications.id, placementOffers.applicationId))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(and(
      eq(placementOffers.status, "ACCEPTED"),
      eq(placementOffers.acceptanceChannel, "EXTERNAL_IMPORT"),
      lte(placementOffers.acceptedDisputableUntil, now),
      isNull(placementOffers.cascadeId),
      // Pending or approved disputes must not occupy the earliest due slots
      // forever. The lock-scoped check below still protects against races.
      notExists(
        db.select({ id: placementLearnerGeneralRequests.id })
          .from(placementLearnerGeneralRequests)
          .where(and(
            eq(placementLearnerGeneralRequests.collegeId, placementJobs.collegeId),
            eq(placementLearnerGeneralRequests.membershipId, placementApplications.membershipId),
            eq(placementLearnerGeneralRequests.kind, "OFFER_ACCEPTANCE_DISPUTE"),
            eq(placementLearnerGeneralRequests.targetKey, placementOffers.id),
            inArray(placementLearnerGeneralRequests.status, ["PENDING", "APPROVED"]),
          )),
      ),
      // Archiving a drive must not strand an already-recorded external
      // acceptance: maturity follows the offer, not the dashboard filter.
    ))
    .orderBy(asc(placementOffers.acceptedDisputableUntil), asc(placementOffers.id))
    .limit(limit);

  let finalized = 0;
  let disputed = 0;
  let skipped = 0;
  let failed = 0;
  for (const item of due) {
    try {
      const outcome = await db.transaction(async (tx) => {
        // Keep the same membership-before-offer lock order as TPO and learner
        // decisions; a dispute review cannot race the last eligibility check.
        const [member] = await tx.select({id: collegeMemberships.id})
          .from(collegeMemberships)
          .where(and(eq(collegeMemberships.id, item.membershipId),
            eq(collegeMemberships.collegeId, item.collegeId)))
          .for("update").limit(1);
        if (!member) return "SKIPPED" as const;

        const [offer] = await tx.select().from(placementOffers)
          .where(eq(placementOffers.id, item.offerId))
          .for("update").limit(1);
        if (!offer || offer.status !== "ACCEPTED" ||
            offer.acceptanceChannel !== "EXTERNAL_IMPORT" ||
            offer.cascadeId || !offer.acceptedDisputableUntil ||
            offer.acceptedDisputableUntil > now) return "SKIPPED" as const;

        // A dispute submitted in-window stays a barrier even after the 48h
        // timestamp until the placement cell resolves it explicitly.
        const [pendingDispute] = await tx.select({id: placementLearnerGeneralRequests.id})
          .from(placementLearnerGeneralRequests)
          .where(and(
            eq(placementLearnerGeneralRequests.collegeId, item.collegeId),
            eq(placementLearnerGeneralRequests.membershipId, item.membershipId),
            eq(placementLearnerGeneralRequests.kind, "OFFER_ACCEPTANCE_DISPUTE"),
            eq(placementLearnerGeneralRequests.targetKey, offer.id),
            inArray(placementLearnerGeneralRequests.status, ["PENDING", "APPROVED"]),
          )).limit(1);
        if (pendingDispute) return "DISPUTED" as const;

        const actorUserId = offer.respondedByUserId ?? offer.issuedByUserId;
        const cascade = await cascadeTpoRecordedAcceptance(tx, {
          actorUserId, membershipId: item.membershipId, collegeId: item.collegeId,
          offer: {
            id: offer.id, applicationId: offer.applicationId,
            kind: offer.kind, annualCtcInr: offer.annualCtcInr,
          },
          now,
        });
        const [saved] = await tx.update(placementOffers).set({
          cascadeId: cascade.cascadeId, updatedAt: now,
        }).where(and(eq(placementOffers.id, offer.id),
          eq(placementOffers.status, "ACCEPTED"),
          eq(placementOffers.acceptanceChannel, "EXTERNAL_IMPORT"),
          isNull(placementOffers.cascadeId)))
          .returning({id: placementOffers.id});
        if (!saved) throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
        return "FINALIZED" as const;
      });
      if (outcome === "FINALIZED") finalized += 1;
      else if (outcome === "DISPUTED") disputed += 1;
      else skipped += 1;
    } catch {
      // The offer remains unfinalized; do not mark it consumed or abort the
      // rest of the batch. The next authorized sweep may retry.
      failed += 1;
    }
  }
  return {examined: due.length, finalized, disputed, skipped, failed};
}
