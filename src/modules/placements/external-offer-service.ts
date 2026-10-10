import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema";
import {
  placementExternalOfferEvents,
  placementExternalOffers,
} from "@/db/schema/placement-external";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { requirePlacementManageScope } from "./scope";
import {
  nextExternalOfferStatus,
  type ExternalOfferDecision,
  type ExternalOfferStatus,
} from "./external-offer-policy";

const uuid = z.string().uuid();
const submitInput = z.object({
  companyName: z.string().trim().min(1).max(200),
  ctcLpa: z.string().regex(/^(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?$/)
    .nullable().optional(),
}).strict();

const reviewInput = z.object({
  offerId: uuid,
  action: z.enum(["VERIFY", "REJECT", "REVOKE"]),
  reason: z.string().trim().min(1).max(500).nullable().optional(),
}).strict().superRefine((data, ctx) => {
  if (data.action !== "VERIFY" && !data.reason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Rejection and revocation require a reason",
      path: ["reason"],
    });
  }
});

export class ExternalOfferError extends Error {
  constructor(public readonly code:
    | "DB08_EXTERNAL_OFFER_NOT_FOUND"
    | "DB08_EXTERNAL_OFFER_INVALID_TRANSITION") {
    super(code);
    this.name = "ExternalOfferError";
  }
}

// Never return the private offer letter storage path through a normal JSON API.
const publicOfferFields = {
  id: placementExternalOffers.id,
  collegeId: placementExternalOffers.collegeId,
  membershipId: placementExternalOffers.membershipId,
  companyName: placementExternalOffers.companyName,
  ctcLpa: placementExternalOffers.ctcLpa,
  status: placementExternalOffers.status,
  submittedByUserId: placementExternalOffers.submittedByUserId,
  reviewedAt: placementExternalOffers.reviewedAt,
  reviewReason: placementExternalOffers.reviewReason,
  revokedAt: placementExternalOffers.revokedAt,
  createdAt: placementExternalOffers.createdAt,
  updatedAt: placementExternalOffers.updatedAt,
} as const;

/**
 * A learner's off-campus offer is NOT a fabricated placement_jobs row.
 * The learner submits only company and compensation. Private letter upload
 * awaits W01's verified object-access/storage contract; paths cannot be
 * injected from the browser.
 *
 * STAGED, NOT ROUTED until W01 journals DB08-C tables and constraints.
 */
export async function submitOwnExternalOffer(
  context: RequestContext,
  raw: unknown,
) {
  const input = submitInput.parse(raw);
  const membership = await requireLearnerPlacementAccess(context);
  return getDb().transaction(async (tx) => {
    // Serialize matching submissions to prevent double-counting retries.
    const [college] = await tx.select({ id: colleges.id }).from(colleges)
      .where(eq(colleges.id, membership.collegeId)).for("update").limit(1);
    if (!college) throw new AuthorizationError("placements.read");

    const normalizedCompany = input.companyName.trim();
    const [existing] = await tx.select(publicOfferFields)
      .from(placementExternalOffers)
      .where(and(
        eq(placementExternalOffers.collegeId, membership.collegeId),
        eq(placementExternalOffers.membershipId, membership.id),
        eq(placementExternalOffers.status, "SUBMITTED"),
        sql`lower(${placementExternalOffers.companyName}) = lower(${normalizedCompany})`,
        input.ctcLpa == null
          ? sql`${placementExternalOffers.ctcLpa} is null`
          : eq(placementExternalOffers.ctcLpa, input.ctcLpa),
      )).limit(1);
    if (existing) return existing;

    const [offer] = await tx.insert(placementExternalOffers).values({
      collegeId: membership.collegeId,
      membershipId: membership.id,
      companyName: normalizedCompany,
      ctcLpa: input.ctcLpa ?? null,
      submittedByUserId: context.user.id,
      status: "SUBMITTED",
    }).returning({ id: placementExternalOffers.id });
    if (!offer) throw new Error("DB08 external offer insert returned no row");
    await tx.insert(placementExternalOfferEvents).values({
      offerId: offer.id,
      priorStatus: null,
      nextStatus: "SUBMITTED",
      actorUserId: context.user.id,
    });
    const [created] = await tx.select(publicOfferFields)
      .from(placementExternalOffers)
      .where(eq(placementExternalOffers.id, offer.id)).limit(1);
    if (!created) throw new Error("DB08 external offer insert lost");
    return created;
  });
}

export async function listOwnExternalOffers(context: RequestContext) {
  const membership = await requireLearnerPlacementAccess(context);
  return getDb().select(publicOfferFields).from(placementExternalOffers)
    .where(and(
      eq(placementExternalOffers.collegeId, membership.collegeId),
      eq(placementExternalOffers.membershipId, membership.id),
    )).orderBy(desc(placementExternalOffers.createdAt));
}

export async function listManagedExternalOffers(
  context: RequestContext,
  collegeIdInput: unknown,
) {
  const collegeId = uuid.parse(collegeIdInput);
  await requirePlacementManageScope(context, collegeId);
  return getDb().select(publicOfferFields).from(placementExternalOffers)
    .where(eq(placementExternalOffers.collegeId, collegeId))
    .orderBy(desc(placementExternalOffers.createdAt));
}

/**
 * Only managers may verify/reject a submitted outside offer, or revoke a
 * previously verified outside offer. Decisions and events share one commit.
 * A repeated identical review is idempotent; conflicting actions are not.
 */
export async function reviewExternalOffer(
  context: RequestContext,
  raw: unknown,
) {
  const input = reviewInput.parse(raw);
  const [target] = await getDb().select({
    id: placementExternalOffers.id,
    collegeId: placementExternalOffers.collegeId,
  }).from(placementExternalOffers)
    .where(eq(placementExternalOffers.id, input.offerId)).limit(1);
  if (!target) throw new ExternalOfferError("DB08_EXTERNAL_OFFER_NOT_FOUND");
  await requirePlacementManageScope(context, target.collegeId);

  return getDb().transaction(async tx => {
    const [college] = await tx.select({ id: colleges.id }).from(colleges)
      .where(eq(colleges.id, target.collegeId)).for("update").limit(1);
    if (!college) throw new ExternalOfferError("DB08_EXTERNAL_OFFER_NOT_FOUND");

    const [row] = await tx.select().from(placementExternalOffers)
      .where(and(
        eq(placementExternalOffers.id, target.id),
        eq(placementExternalOffers.collegeId, target.collegeId),
      )).for("update").limit(1);
    if (!row) throw new ExternalOfferError("DB08_EXTERNAL_OFFER_NOT_FOUND");

    const intended =
      input.action === "VERIFY" ? "VERIFIED"
      : input.action === "REJECT" ? "REJECTED" : "REVOKED";
    if (row.status === intended) {
      const [same] = await tx.select(publicOfferFields)
        .from(placementExternalOffers)
        .where(eq(placementExternalOffers.id, row.id)).limit(1);
      return same;
    }

    let next: ExternalOfferStatus;
    try {
      next = nextExternalOfferStatus(
        row.status as ExternalOfferStatus,
        input.action as ExternalOfferDecision,
      );
    } catch {
      throw new ExternalOfferError("DB08_EXTERNAL_OFFER_INVALID_TRANSITION");
    }
    const now = new Date();
    const [updated] = await tx.update(placementExternalOffers).set(
      next === "REVOKED" ? {
        status: next,
        revokedAt: now,
        revokedByUserId: context.user.id,
        revokeReason: input.reason ?? null,
        updatedAt: now,
      } : {
        status: next,
        reviewedAt: now,
        reviewedByUserId: context.user.id,
        reviewReason: input.reason ?? null,
        updatedAt: now,
      },
    ).where(and(
      eq(placementExternalOffers.id, row.id),
      eq(placementExternalOffers.collegeId, target.collegeId),
    )).returning(publicOfferFields);
    if (!updated) throw new ExternalOfferError("DB08_EXTERNAL_OFFER_NOT_FOUND");
    await tx.insert(placementExternalOfferEvents).values({
      offerId: row.id,
      priorStatus: row.status,
      nextStatus: next,
      actorUserId: context.user.id,
      reason: input.reason ?? null,
    });
    return updated;
  });
}
