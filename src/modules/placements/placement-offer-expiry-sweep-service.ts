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
 * EXPIRED is registered by migration 0085. The authenticated internal route
 * /api/internal/placements/tpo/offer-expiry/run calls runTpoOfferExpiryTick,
 * which is registered with a 15-minute Asia/Kolkata scheduler contract in
 * tpo-scheduled-job-registry. Each tick drains up to five short, skip-locked
 * 100-offer transactions, safely retrying overdue rows on later invocations.
 * External deployment must configure the actual cron, scheduler secret,
 * service actor, and enabled flag; application code alone does not run timers.
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
      jobId:placementJobs.id,
      jobTitle:placementJobs.title,
      organizationId:colleges.organizationId,
      collegeStatus:colleges.status,
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
        groupKey:"placement-job:"+row.jobId+":offers",
        dedupeKey:"placement-offer-expired:"+row.id,
      }).onConflictDoNothing().returning({id:activityEvents.id});
      // Historical expiry remains auditable after college suspension, but
      // a stopped tenant must not receive a fresh notification.
      if(event&&row.collegeStatus==="ACTIVE")await deliverRecordedLearnerPlacementEvent(tx,{
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

/** Drain multiple short, skip-locked transactions within a fixed run budget.
 * A scheduled invoker may call this repeatedly; this function does not
 * imply that a deployment cron or reminder service is configured. A worker
 * may see zero unlocked rows while another transaction is still processing.
 */
export async function drainExpiredPlacementOffers(actorUserId:string,now:Date,opts:{
 batchSize?:number;maxBatches?:number;maxRunMs?:number;
}={}):Promise<{expired:number;batches:number;drained:boolean}>{
 const batchSize=opts.batchSize??100,maxBatches=opts.maxBatches??20,maxRunMs=opts.maxRunMs??15_000;
 if(!Number.isInteger(batchSize)||batchSize<1||batchSize>100||
    !Number.isInteger(maxBatches)||maxBatches<1||maxBatches>100||
    !Number.isInteger(maxRunMs)||maxRunMs<100||maxRunMs>120_000)
  throw new Error("Invalid offer sweep run bounds");
 if(!Number.isFinite(now.getTime()))throw new Error("Invalid offer sweep reference date");
 const stopAt=Date.now()+maxRunMs;
 let expired=0,batches=0;
 while(batches<maxBatches&&Date.now()<stopAt){
  const changed=await sweepExpiredPlacementOffers(actorUserId,now,batchSize);
  batches++;expired+=changed;
  if(changed<batchSize)return {expired,batches,drained:true};
 }
 return {expired,batches,drained:false};
}
