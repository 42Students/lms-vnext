import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications,
  placementJobs,
  placementJoiningOutcomes,
  placementOffers,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { actOnPlacementOffer } from "./offer-service";
import {
  bulkOfferWithdrawalSchema,
  classifyBulkOfferWithdrawal,
  summarizeBulkOfferWithdrawal,
  type BulkOfferWithdrawalResult,
} from "./bulk-offer-withdrawal-model";
import { requirePlacementManageScope } from "./scope";
import { placementJobIdSchema } from "./validation";
import { PlacementsServiceError } from "./errors";

/**
 * Administrative bulk action: only WITHDRAW is supported. ACCEPT/DECLINE
 * remains the learner's own decision in actOnPlacementOffer.
 * Existing audited single-offer transitions are reused for each item.
 */
export async function bulkWithdrawPlacementOffers(
  context: RequestContext,
  rawJobId: unknown,
  rawInput: unknown,
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
  const input = bulkOfferWithdrawalSchema.parse(rawInput);

  // Derive the college from the active membership, not a client payload.
  const [job] = await getDb().select({ id: placementJobs.id, collegeId: placementJobs.collegeId })
    .from(placementJobs).where(and(
      eq(placementJobs.id, jobId),
      eq(placementJobs.collegeId, collegeId),
    )).limit(1);
  if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  await requirePlacementManageScope(context, job.collegeId);

  const scopedOffers = await getDb().select({
    id: placementOffers.id,
    status: placementOffers.status,
    joiningStatus: placementJoiningOutcomes.status,
  }).from(placementOffers)
    .innerJoin(placementApplications, eq(placementApplications.id, placementOffers.applicationId))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .leftJoin(placementJoiningOutcomes, eq(placementJoiningOutcomes.offerId, placementOffers.id))
    .where(and(
      eq(placementJobs.id, job.id),
      eq(placementJobs.collegeId, collegeId),
      inArray(placementOffers.id, input.offers.map((offer) => offer.id)),
    ));
  const byId = new Map(scopedOffers.map((offer) => [offer.id, offer]));
  const results: BulkOfferWithdrawalResult[] = [];

  for (const offer of input.offers) {
    const decision = classifyBulkOfferWithdrawal(
      offer.id,
      byId.get(offer.id) ?? null,
      offer.expectedStatus,
    );
    if (decision.status !== "withdrawn") {
      results.push(decision);
      continue;
    }
    try {
      const updated = await actOnPlacementOffer(context, offer.id, {
        action: "WITHDRAW",
        reason: input.reason,
      }, new Date(), offer.expectedStatus);
      results.push({
        offerId: offer.id,
        status: updated?.status === "WITHDRAWN" ? "withdrawn" : "ineligible",
        ...(updated?.status === "WITHDRAWN" ? {} : { reason: "Offer was not withdrawn" }),
      });
    } catch (error) {
      if (error instanceof PlacementsServiceError &&
        ["PLACEMENT_OFFER_INVALID_TRANSITION", "PLACEMENT_OFFER_NOT_FOUND"].includes(error.code)) {
        results.push({
          offerId: offer.id,
          status: "ineligible",
          reason: "Offer is no longer withdrawable; refresh and review",
        });
        continue;
      }
      throw error;
    }
  }
  return { results, counts: summarizeBulkOfferWithdrawal(results) };
}
