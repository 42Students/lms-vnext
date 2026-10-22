import "server-only";
import { and, asc, desc, eq, gt, isNotNull, isNull, lte, lt, notExists, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
 activityEvents,colleges,placementApplications,placementJobs,
 placementOffers,placementOfferStatusHistory,
} from "@/db/schema";
import {deliverRecordedLearnerPlacementEvent} from "./learner-placement-event-delivery";
import { isIssuedPlacementOfferDue } from "./placement-offer-sweep-policy";
import {offerExpiryWriteDecision} from "./tpo-drive-offer-register-model";
import {placementJobExpiryAuditKey} from "./application-deadline-policy";

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
      respondedAt:placementOffers.respondedAt,
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
      // Resolve the last persisted response first. An imported ISSUED row may
      // already have an ACCEPTED/DECLINED outcome in immutable status history;
      // merely deriving an EXPIRED badge would overwrite that real decision.
      // Locking the offer above prevents an active learner response racing this
      // correction. Reissues end in ISSUED and correctly supersede old answers.
      const [lastHistory]=await tx.select({toStatus:placementOfferStatusHistory.toStatus})
        .from(placementOfferStatusHistory)
        .where(eq(placementOfferStatusHistory.offerId,row.id))
        .orderBy(desc(placementOfferStatusHistory.createdAt),desc(placementOfferStatusHistory.id))
        .limit(1);
      const decision=offerExpiryWriteDecision({
        offerStatus:row.status,respondedAt:row.respondedAt,
        respondBy:row.expiresAt,now,
        applicationDecision:lastHistory?.toStatus==="ACCEPTED"?"ACCEPTED":
          lastHistory?.toStatus==="DECLINED"?"DECLINED":null,
      });
      if(decision==="RECONCILE_ACCEPTED"||decision==="RECONCILE_DECLINED"){
        // Existing terminal history is the audit proof; do not append a
        // fictitious new learner response or re-notify anyone on reconciliation.
        await tx.update(placementOffers).set({
          status:decision==="RECONCILE_ACCEPTED"?"ACCEPTED":"DECLINED",
          updatedAt:now,
        }).where(and(eq(placementOffers.id,row.id),eq(placementOffers.status,"ISSUED")));
        continue;
      }
      // A recorded response with missing historical evidence must be
      // investigated, not automatically expired. Only unanswered rows expire.
      if(decision!=="MARK_EXPIRED"||!isIssuedPlacementOfferDue(row, now))continue;
      const [updated] = await tx.update(placementOffers).set({
        status: "EXPIRED",
        updatedAt: now,
      }).where(and(
        eq(placementOffers.id, row.id),
        eq(placementOffers.status, "ISSUED"),
        isNull(placementOffers.respondedAt),
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

/**
 * Hourly legacy "offers expiring soon" counterpart. This is separate from
 * overdue expiry transitions: no status or deadline is changed here.
 * One scoped reminder per issued offer is recorded as an immutable,
 * deduplicated event. The JOIN to the learner application controls audience.
 */
export async function remindExpiringPlacementOffers(
  actorUserId: string, now: Date, limit = 100,
): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isFinite(now.getTime())) {
    throw new Error("Invalid offer reminder run bounds");
  }
  const horizon = new Date(now.getTime() + 24 * 60 * 60_000);
  return getDb().transaction(async tx => {
    const previouslyReminded = tx.select({ id: activityEvents.id })
      .from(activityEvents)
      .where(and(
        eq(activityEvents.subjectType, "placement_offer"),
        eq(activityEvents.subjectId, placementOffers.id),
        eq(activityEvents.eventType, "PLACEMENTS_OFFER_EXPIRING"),
      ));
    const rows = await tx.select({
      id: placementOffers.id,
      expiresAt: placementOffers.expiresAt,
      roleTitle: placementOffers.roleTitle,
      membershipId: placementApplications.membershipId,
      collegeId: placementJobs.collegeId,
      jobId: placementJobs.id,
      jobTitle: placementJobs.title,
      organizationId: colleges.organizationId,
    }).from(placementOffers)
      .innerJoin(placementApplications,
        eq(placementApplications.id, placementOffers.applicationId))
      .innerJoin(placementJobs,
        eq(placementJobs.id, placementApplications.jobId))
      .innerJoin(colleges, eq(colleges.id, placementJobs.collegeId))
      .where(and(
        eq(placementOffers.status, "ISSUED"),
        eq(placementApplications.status, "SUBMITTED"),
        eq(colleges.status, "ACTIVE"),
        isNotNull(placementOffers.expiresAt),
        gt(placementOffers.expiresAt, now),
        lte(placementOffers.expiresAt, horizon),
        notExists(previouslyReminded),
      ))
      .orderBy(asc(placementOffers.expiresAt), asc(placementOffers.id))
      .limit(limit).for("update", { of: placementOffers, skipLocked: true });

    let reminded = 0;
    for (const row of rows) {
      const [event] = await tx.insert(activityEvents).values({
        organizationId: row.organizationId,
        collegeId: row.collegeId,
        actorUserId,
        actorMembershipId: null,
        module: "PLACEMENTS",
        eventType: "PLACEMENTS_OFFER_EXPIRING",
        subjectType: "placement_offer",
        subjectId: row.id,
        subjectLabel: row.roleTitle,
        summary: "Offer expires within 24 hours for " + row.jobTitle,
        metadata: { offerId: row.id, jobTitle: row.jobTitle,
          expiryAt: row.expiresAt?.toISOString() ?? null },
        groupKey: "placement-job:" + row.jobId + ":offers",
        dedupeKey: "placement-offer-expiring:" + row.id,
      }).onConflictDoNothing().returning({ id: activityEvents.id });
      if (!event) continue;
      await deliverRecordedLearnerPlacementEvent(tx, {
        eventId: event.id, collegeId: row.collegeId,
        membershipId: row.membershipId,
        kind: "APPLICATION_STATUS_CHANGED",
        subject: "Offer expires soon for " + row.jobTitle,
      });
      reminded += 1;
    }
    return reminded;
  });
}

/**
 * Audit application deadlines separately from offer expiry. The effective
 * status is EXPIRED as soon as a published drive crosses its deadline; the
 * underlying PUBLISHED lifecycle must remain intact so past applicants,
 * offer holders and rounds are not silently put through manual Close.
 *
 * This idempotent sweep records the historical transition for operators.
 * A second expiry after an explicit deadline extension receives a distinct
 * event. The outer scheduler holds a persisted 12-minute lease and checks
 * its fencing token before each bounded transaction.
 */
export async function auditExpiredPlacementJobDeadlines(
 actorUserId:string,now:Date,limit=100,
):Promise<number>{
 if(!Number.isInteger(limit)||limit<1||limit>100||
    !Number.isFinite(now.getTime()))
  throw new Error("Invalid job expiry sweep bounds");
 return getDb().transaction(async tx=>{
  // Correlate by both job and deadline. A prior expiry event must not
  // suppress a second expiry after a legitimate extension.
  const audited=tx.select({id:activityEvents.id}).from(activityEvents)
   .where(and(
    eq(activityEvents.subjectType,"placement_job"),
    eq(activityEvents.eventType,"PLACEMENTS_JOB_DEADLINE_EXPIRED"),
    eq(activityEvents.subjectId,placementJobs.id),
    eq(activityEvents.dedupeKey,sql<string>`'placement-job-deadline-expired:' ||
     ${placementJobs.id}::text || ':' ||
     floor(extract(epoch from ${placementJobs.applicationDeadline}) * 1000)::bigint::text`),
   ));
  const jobs=await tx.select({
   id:placementJobs.id,title:placementJobs.title,
   collegeId:placementJobs.collegeId,
   deadline:placementJobs.applicationDeadline,
   organizationId:colleges.organizationId,
  }).from(placementJobs)
   .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
   .where(and(eq(placementJobs.status,"PUBLISHED"),
    isNotNull(placementJobs.applicationDeadline),
    lt(placementJobs.applicationDeadline,now),
    notExists(audited)))
   .orderBy(asc(placementJobs.applicationDeadline),asc(placementJobs.id))
   .limit(limit).for("update",{of:placementJobs,skipLocked:true});
  let recorded=0;
  for(const job of jobs){
   if(!job.deadline)continue;
   const [event]=await tx.insert(activityEvents).values({
    organizationId:job.organizationId,collegeId:job.collegeId,
    actorUserId,actorMembershipId:null,module:"PLACEMENTS",
    eventType:"PLACEMENTS_JOB_DEADLINE_EXPIRED",
    subjectType:"placement_job",subjectId:job.id,subjectLabel:job.title,
    summary:"Application deadline passed for "+job.title,
    metadata:{deadlineAt:job.deadline.toISOString()},
    groupKey:"placement-job:"+job.id,
    dedupeKey:placementJobExpiryAuditKey(job.id,job.deadline),
   }).onConflictDoNothing().returning({id:activityEvents.id});
   if(event)recorded++;
  }
  return recorded;
 });
}
