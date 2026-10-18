import "server-only";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  collegeMemberships,
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
    const items: { offerId: string; action: typeof input.action; status: string }[] = [];
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
      if (input.action === "RECORD_JOINED" &&
          !canRecordTpoActualJoiningDate(input.joiningDate!, now)) {
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
          ...(nextStatus === "WITHDRAWN" ? {
            withdrawnByUserId: context.user.id,
            withdrawnAt: now,
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
        await tx.insert(placementOfferStatusHistory).values({
          offerId: offer.id,
          fromStatus: offer.status,
          toStatus: nextStatus,
          actorUserId: context.user.id,
          reason: input.reason,
        });
        if (nextStatus === "ACCEPTED") {
          await tx.insert(placementJoiningOutcomes)
            .values({ offerId: offer.id }).onConflictDoNothing();
        }
      }
      await recordActivityEventInTransaction(tx, context, {
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
        },
        groupKey: "placement-job:" + jobId + ":offers",
      });
      items.push({ offerId: offer.id, action: input.action, status: nextStatus });
    }
    return { updated: items.length, items };
  });
}
