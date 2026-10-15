/**
 * P-S1-06: compensation for an accepted offer's atomic cascade.
 * Migrated status-history columns and reversal transitions now exist in 0088.
 * API exposure still requires orchestrator integration and concurrency acceptance.
 */
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, placementApplications,
  placementApplicationStatusHistory, placementJobs,
  placementJoiningHistory, placementJoiningOutcomes,
  placementOffers, placementOfferStatusHistory,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { placementOfferIdSchema } from "./validation";
import { assertUndoablePlacementCascadeSnapshot } from "./placement-cascade-undo-policy";

export async function undoPlacementOfferCascade(
  context: RequestContext,
  offerIdInput: string,
  cascadeIdInput: string,
) {
  const offerId = placementOfferIdSchema.parse(offerIdInput);
  const cascadeId = placementOfferIdSchema.parse(cascadeIdInput);
  const db = getDb();
  const [owner] = await db.select({
    membershipId: placementApplications.membershipId,
    collegeId: placementJobs.collegeId,
  }).from(placementOffers)
    .innerJoin(placementApplications,
      eq(placementApplications.id, placementOffers.applicationId))
    .innerJoin(placementJobs,
      eq(placementJobs.id, placementApplications.jobId))
    .where(eq(placementOffers.id, offerId)).limit(1);
  if (!owner) throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
  await requirePlacementManageScope(context, owner.collegeId);

  return db.transaction(async (tx) => {
    // The same parent membership serializes accept, issue, self-withdraw and undo.
    const [membership] = await tx.select({
      collegeId: collegeMemberships.collegeId,
    }).from(collegeMemberships)
      .where(eq(collegeMemberships.id, owner.membershipId))
      .for("update").limit(1);
    if (!membership || membership.collegeId !== owner.collegeId) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_NOT_FOUND");
    }
    const [accepted] = await tx.select({
      status: placementOffers.status,
    }).from(placementOffers)
      .where(eq(placementOffers.id, offerId)).for("update").limit(1);
    const acceptedHistory = await tx.select({
      reason: placementOfferStatusHistory.reason,
      cascadeId: placementOfferStatusHistory.cascadeId,
      toStatus: placementOfferStatusHistory.toStatus,
    }).from(placementOfferStatusHistory).where(
      eq(placementOfferStatusHistory.offerId, offerId),
    ).orderBy(desc(placementOfferStatusHistory.createdAt),
      desc(placementOfferStatusHistory.id)).limit(1);

    if (accepted?.status === "ISSUED" &&
        acceptedHistory[0]?.reason === `cascade-undo:${cascadeId}`) {
      return { cascadeId, alreadyUndone: true, restoredApplications: 0, restoredOffers: 0 };
    }

    const siblingOfferHistory = await tx.select({
      offerId: placementOfferStatusHistory.offerId,
      status: placementOffers.status,
    }).from(placementOfferStatusHistory)
      .innerJoin(placementOffers,
        eq(placementOffers.id, placementOfferStatusHistory.offerId))
      .innerJoin(placementApplications,
        eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementJobs,
        eq(placementJobs.id, placementApplications.jobId))
      .where(and(
        eq(placementOfferStatusHistory.toStatus, "DECLINED"),
        eq(placementOfferStatusHistory.cascadeId, cascadeId),
        eq(placementOfferStatusHistory.reason, `placed elsewhere; cascade:${cascadeId}`),
        eq(placementApplications.membershipId, owner.membershipId),
        eq(placementJobs.collegeId, owner.collegeId),
      ));

    const siblingApplicationHistory = await tx.select({
      applicationId: placementApplicationStatusHistory.applicationId,
      status: placementApplications.status,
    }).from(placementApplicationStatusHistory)
      .innerJoin(placementApplications,
        eq(placementApplications.id, placementApplicationStatusHistory.applicationId))
      .innerJoin(placementJobs,
        eq(placementJobs.id, placementApplications.jobId))
      .where(and(
        eq(placementApplicationStatusHistory.cascadeId, cascadeId),
        eq(placementApplicationStatusHistory.reason, `placed elsewhere; cascade:${cascadeId}`),
        eq(placementApplications.membershipId, owner.membershipId),
        eq(placementJobs.collegeId, owner.collegeId),
      ));

    const [joining] = await tx.select().from(placementJoiningOutcomes)
      .where(eq(placementJoiningOutcomes.offerId, offerId)).for("update").limit(1);
    const [joiningHistory] = await tx.select({ id: placementJoiningHistory.id })
      .from(placementJoiningHistory)
      .where(eq(placementJoiningHistory.offerId, offerId)).limit(1);

    if (acceptedHistory[0]?.cascadeId !== cascadeId) {
      throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
    }
    assertUndoablePlacementCascadeSnapshot({
      acceptedStatus: accepted?.status ?? null,
      acceptedHistoryReason: acceptedHistory[0]?.reason ?? null,
      cascadeId,
      joiningStatus: joining?.status ?? null,
      joiningHasHistory: Boolean(joiningHistory),
      siblingOfferStatuses: siblingOfferHistory.map((row) => row.status),
      siblingApplicationStatuses: siblingApplicationHistory.map((row) => row.status),
    });

    // No subsequent changes to a sibling may be silently overwritten.
    for (const row of siblingOfferHistory) {
      const [latest] = await tx.select({ reason: placementOfferStatusHistory.reason })
        .from(placementOfferStatusHistory)
        .where(eq(placementOfferStatusHistory.offerId, row.offerId))
        .orderBy(desc(placementOfferStatusHistory.createdAt),
          desc(placementOfferStatusHistory.id)).limit(1);
      if (latest?.reason !== `placed elsewhere; cascade:${cascadeId}`) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
      }
    }
    for (const row of siblingApplicationHistory) {
      const [latest] = await tx.select({ reason: placementApplicationStatusHistory.reason })
        .from(placementApplicationStatusHistory)
        .where(eq(placementApplicationStatusHistory.applicationId, row.applicationId))
        .orderBy(desc(placementApplicationStatusHistory.createdAt),
          desc(placementApplicationStatusHistory.id)).limit(1);
      if (latest?.reason !== `placed elsewhere; cascade:${cascadeId}`) {
        throw new PlacementsServiceError("PLACEMENT_OFFER_INVALID_TRANSITION");
      }
    }

    const now = new Date();
    for (const row of siblingApplicationHistory) {
      await tx.update(placementApplications).set({
        status: "SUBMITTED", withdrawnAt: null, updatedAt: now,
      }).where(eq(placementApplications.id, row.applicationId));
      await tx.insert(placementApplicationStatusHistory).values({
        applicationId: row.applicationId, fromStatus: "WITHDRAWN",
        toStatus: "SUBMITTED", actorUserId: context.user.id,
        reason: `cascade-undo:${cascadeId}`, cascadeId,
      });
    }
    for (const row of siblingOfferHistory) {
      await tx.update(placementOffers).set({
        status: "ISSUED", respondedByUserId: null, respondedAt: null,
        updatedAt: now,
      }).where(eq(placementOffers.id, row.offerId));
      await tx.insert(placementOfferStatusHistory).values({
        offerId: row.offerId, fromStatus: "DECLINED",
        toStatus: "ISSUED", actorUserId: context.user.id,
        reason: `cascade-undo:${cascadeId}`, cascadeId,
      });
    }
    if (joining) {
      await tx.delete(placementJoiningOutcomes)
        .where(eq(placementJoiningOutcomes.offerId, offerId));
    }
    await tx.update(placementOffers).set({
      status: "ISSUED", respondedByUserId: null, respondedAt: null, updatedAt: now,
    }).where(eq(placementOffers.id, offerId));
    await tx.insert(placementOfferStatusHistory).values({
      offerId, fromStatus: "ACCEPTED", toStatus: "ISSUED",
      actorUserId: context.user.id, reason: `cascade-undo:${cascadeId}`, cascadeId,
    });
    return { cascadeId, alreadyUndone: false,
      restoredApplications: siblingApplicationHistory.length,
      restoredOffers: siblingOfferHistory.length };
  });
}
