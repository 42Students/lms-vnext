import "server-only";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
 activityEvents,colleges,placementApplications,placementJobs,
 placementOffers,placementOfferStatusHistory,
} from "@/db/schema";
import {deliverRecordedLearnerPlacementEvent} from "./learner-placement-event-delivery";
import { isIssuedPlacementOfferDue } from "./placement-offer-sweep-policy";

/**
 * P-S1-07: transaction-bound batch primitive for the 15-minute expiry job.
 *
 * EXPIRED is registered by migration 0085. This transactional primitive is
 * now compatible with the real constraint; scheduler invocation every 15
 * minutes and end-to-end race/notification acceptance remain outstanding.
 */
export async function sweepExpiredPlacementOffers(
  actorUserId: string,
  now: Date,
  limit = 100,
): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Invalid offer sweep batch size");
  }
  // Invalid caller/scheduler clocks must never be sent to PostgreSQL as
  // timestamptz predicates, nor silently make an overdue sweep a no-op.
  if (!Number.isFinite(now.getTime())) {
    throw new Error("Invalid offer sweep reference date");
  }
  // Separate sweep workers must skip rows locked by a competing sweep or
  // learner offer response, never block a 15-minute batch behind them.
  return getDb().transaction(async (tx) => {
    const candidates = await tx.select({
      id: placementOffers.id,
      status: placementOffers.status,
      expiresAt: placementOffers.expiresAt,
      roleTitle:placementOffers.roleTitle,
      membershipId:placementApplications.membershipId,
      collegeId:placementJobs.collegeId,
      jobTitle:placementJobs.title,
      organizationId:colleges.organizationId,
    }).from(placementOffers)
      .innerJoin(placementApplications,
        eq(placementApplications.id,placementOffers.applicationId))
      .innerJoin(placementJobs,
        eq(placementJobs.id,placementApplications.jobId))
      .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
      .where(and(
      eq(placementOffers.status, "ISSUED"),
      isNotNull(placementOffers.expiresAt),
      lte(placementOffers.expiresAt, now),
    )).orderBy(asc(placementOffers.expiresAt), asc(placementOffers.id))
      .limit(limit).for("update",{of:placementOffers,skipLocked:true});

    let expired = 0;
    for (const row of candidates) {
      if (!isIssuedPlacementOfferDue(row, now)) continue;
      const [updated] = await tx.update(placementOffers).set({
        status: "EXPIRED",
        updatedAt: now,
      }).where(and(
        eq(placementOffers.id, row.id),
        eq(placementOffers.status, "ISSUED"),
      )).returning({ id: placementOffers.id });
      if (!updated) continue;
      await tx.insert(placementOfferStatusHistory).values({
        offerId: row.id,
        fromStatus: "ISSUED",
        toStatus: "EXPIRED",
        actorUserId,
      });
      const [event]=await tx.insert(activityEvents).values({
        organizationId:row.organizationId,
        collegeId:row.collegeId,
        actorUserId,
        actorMembershipId:null,
        module:"PLACEMENTS",
        eventType:"PLACEMENTS_OFFER_EXPIRED",
        subjectType:"placement_offer",
        subjectId:row.id,
        subjectLabel:row.roleTitle,
        summary:"Offer expired for "+row.jobTitle,
        metadata:{offerId:row.id,jobTitle:row.jobTitle,
          expiryAt:row.expiresAt?.toISOString()??null},
        groupKey:"placement-job:"+row.collegeId+":offers",
        dedupeKey:"placement-offer-expired:"+row.id,
      }).onConflictDoNothing().returning({id:activityEvents.id});
      if(event)await deliverRecordedLearnerPlacementEvent(tx,{
        eventId:event.id,collegeId:row.collegeId,
        membershipId:row.membershipId,
        kind:"APPLICATION_STATUS_CHANGED",
        subject:"Offer expired for "+row.jobTitle,
      });
      expired += 1;
    }
    return expired;
  });
}
